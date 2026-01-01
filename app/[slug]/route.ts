export const runtime = 'edge';

/**
 * DYNAMIC CAMPAIGN TRACKER (/[slug])
 * This acts as the entry point for all tracking links.
 * It uses Cloudflare KV for sub-10ms lookups.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(request.url);

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext() as { env: CloudflareEnv };

    // 1. Edge-cached lookup in KV
    const campaignData = await env.CAMPAIGNS.get(slug);
    
    // If no campaign found in KV, return 404
    if (!campaignData) {
      return new Response("Campaign Not Found", { status: 404 });
    }

    const campaign = JSON.parse(campaignData);
    const clickId = crypto.randomUUID();

    // 2. Capture Traffic Source Params from URL
    const paramKeys = (campaign.params || "").split(",").map((k: string) => k.trim());
    const paramValues = paramKeys.map((k: string) => url.searchParams.get(k) || "none");

    // 3. Log Visit to Analytics Engine (Non-blocking)
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          slug, 
          "visit", 
          clickId, 
          // @ts-ignore - cf object is added by Cloudflare runtime
          request.cf?.country || "XX",
          paramValues[0] || "",
          paramValues[1] || "",
          paramValues[2] || ""
        ],
        doubles: [1],
        indexes: [slug]
      });
    }

    // 4. Construct Destination URL (Lander)
    const dest = new URL(campaign.lander_url);
    
    // Pass CID and CMP to the lander for the /click transition
    dest.searchParams.set("cid", clickId);
    dest.searchParams.set("cmp", slug);
    
    // Forward any other original URL parameters (e.g. gclid, adid)
    url.searchParams.forEach((val, key) => {
      dest.searchParams.set(key, val);
    });

    // 5. Fire the redirect
    return Response.redirect(dest.toString(), 302);
    
  } catch (err) {
    console.error("Tracker Error:", err);
    return new Response("Internal Tracker Error", { status: 500 });
  }
}
