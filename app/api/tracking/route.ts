export const runtime = 'edge';

/**
 * Ported Tracking Engine
 * Handles: Visit capturing, redirecting to Lander, and Click ID generation.
 * This version uses standard Web API Response/Request for better Edge compatibility.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Extract slug from query (e.g., /api/tracking?cmp=my-campaign)
  const slug = searchParams.get('cmp'); 
  
  if (!slug) {
    return new Response("Missing Campaign Slug", { status: 400 });
  }

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext() as { env: CloudflareEnv };

    // CAMPAIGNS is your KV Namespace
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
          // @ts-ignore - geo properties provided by Cloudflare
          request.cf?.country || "XX",
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

    return Response.redirect(dest.toString(), 302);
  } catch (err) {
    console.error("Tracking Error:", err);
    return new Response(`Tracking Engine active. Target: ${slug}`, { status: 200 });
  }
}
