export const runtime = 'edge';

/**
 * Ported Tracking Engine
 * Handles: Visit capturing, redirecting to Lander, and Click ID generation.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const slug = searchParams.get('cmp'); 
  
  if (!slug) {
    return new Response("Missing Campaign Slug", { status: 400 });
  }

  try {
    // Dynamically import to avoid build-time resolution issues in non-CF environments
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    
    // Use a local type cast to ensure CAMPAIGNS is recognized even if global merging is delayed
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;

    if (!env.CAMPAIGNS || !env.CLICK_PARAMS) {
      throw new Error("Required KV Bindings ('CAMPAIGNS', 'CLICK_PARAMS') not found");
    }

    const campaignData = await env.CAMPAIGNS.get(slug);
    
    if (!campaignData) {
      return new Response("Campaign Not Found", { status: 404 });
    }

    const campaign = JSON.parse(campaignData);
    const clickId = crypto.randomUUID();

    const paramKeys = (campaign.params || "").split(",").map((k: string) => k.trim());
    const paramValues = paramKeys.map((k: string) => searchParams.get(k) || "none");

    // Store the params against the clickId for later retrieval
    await env.CLICK_PARAMS.put(clickId, JSON.stringify(paramValues));

    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          slug, 
          "visit", 
          clickId, 
          paramValues[0] || "",
          paramValues[1] || "",
          paramValues[2] || "",
          // @ts-ignore - cf property added by Cloudflare at runtime
          request.cf?.country || "XX",
        ],
        doubles: [1],
        indexes: [slug]
      });
    }

    const dest = new URL(campaign.lander_url);
    dest.searchParams.set("cid", clickId);
    dest.searchParams.set("cmp", slug);

    return Response.redirect(dest.toString(), 302);
  } catch (err) {
    console.error("Tracking Error:", err);
    return new Response(`Tracking Engine active. Target: ${slug}`, { status: 200 });
  }
}
