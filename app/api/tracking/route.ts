import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Ported Tracking Engine
 * Handles: Visit capturing, redirecting to Lander, and Click ID generation.
 * Uses dynamic imports to prevent build-time resolution errors.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Extract slug from query (e.g., /api/tracking?cmp=my-campaign)
  const slug = searchParams.get('cmp'); 
  
  if (!slug) {
    return new Response("Missing Campaign Slug", { status: 400 });
  }

  try {
    // Dynamic import to handle environments without @cloudflare/next-on-pages
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();

    const campaignData = await env.CAMPAIGNS.get(slug);
    
    if (!campaignData) {
      return new Response("Campaign Not Found", { status: 404 });
    }

    const campaign = JSON.parse(campaignData);
    const clickId = crypto.randomUUID();

    // Parse custom parameters for the analytics engine
    const paramKeys = (campaign.params || "").split(",").map((k: string) => k.trim());
    const paramValues = paramKeys.map((k: string) => searchParams.get(k) || "none");

    // Log to Analytics Engine if bound
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          slug, 
          "visit", 
          clickId, 
          request.geo?.country || "XX",
          paramValues[0] || "",
          paramValues[1] || "",
          paramValues[2] || ""
        ],
        doubles: [1],
        indexes: [slug]
      });
    }

    // Redirect to Lander
    const dest = new URL(campaign.lander_url);
    dest.searchParams.set("cid", clickId);
    dest.searchParams.set("cmp", slug);

    return NextResponse.redirect(dest.toString(), 302);
  } catch (err) {
    // In preview or local environments where KV/D1 aren't bound, 
    // we log the error and return a fallback message.
    console.error("Tracking Error:", err);
    return new Response(`Tracking Engine active (Fallback mode). Target: ${slug}`, { status: 200 });
  }
}
