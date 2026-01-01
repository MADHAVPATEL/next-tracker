import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

/**
 * Ported Tracking Engine from worker-latest.js
 * Handles: Visit capturing, redirecting to Lander, and Click ID generation.
 */

export async function GET(request: NextRequest) {
  const { env } = getRequestContext();
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Extract slug from path (e.g., /api/tracking/my-campaign -> "my-campaign")
  // Note: You can customize your routing here or use a dedicated dynamic route
  const slug = searchParams.get('cmp'); 
  
  if (!slug) {
    return new Response("Missing Campaign Slug", { status: 400 });
  }

  const campaignData = await env.CAMPAIGNS.get(slug);
  
  if (!campaignData) {
    return new Response("Campaign Not Found", { status: 404 });
  }

  const campaign = JSON.parse(campaignData);
  const clickId = crypto.randomUUID();

  // Parse custom parameters for the analytics engine
  const paramKeys = (campaign.params || "").split(",").map((k: string) => k.trim());
  const paramValues = paramKeys.map((k: string) => searchParams.get(k) || "none");

  // Log to Analytics Engine
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
}
