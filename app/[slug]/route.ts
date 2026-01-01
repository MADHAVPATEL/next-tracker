export const runtime = 'edge';

/**
 * DYNAMIC CAMPAIGN TRACKER (/[slug])
 * Updated to handle structured JSON parameters for better analytics.
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

    const campaignData = await env.CAMPAIGNS.get(slug);
    
    if (!campaignData) {
      return new Response("Campaign Not Found", { status: 404 });
    }

    const campaign = JSON.parse(campaignData);
    const clickId = crypto.randomUUID();

    // 1. Parse Structured JSON Parameters
    // Each param looks like: { key: "s1", value: "{clickid}", name: "Sub 1" }
    let paramConfig = [];
    try {
        paramConfig = typeof campaign.params === 'string' ? JSON.parse(campaign.params) : (campaign.params || []);
    } catch (e) {
        paramConfig = [];
    }

    // Map incoming URL values based on the config keys
    // We capture up to the first 3 for basic Analytics Engine blobs
    const capturedValues = paramConfig.slice(0, 3).map((p: any) => url.searchParams.get(p.key) || "none");

    // 2. Log Visit to Analytics Engine (Non-blocking)
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          slug, 
          "visit", 
          clickId, 
          // @ts-ignore
          request.cf?.country || "XX",
          capturedValues[0] || "",
          capturedValues[1] || "",
          capturedValues[2] || ""
        ],
        doubles: [1],
        indexes: [slug]
      });
    }

    // 3. Construct Destination URL (Lander)
    const dest = new URL(campaign.lander_url);
    dest.searchParams.set("cid", clickId);
    dest.searchParams.set("cmp", slug);
    
    // Forward all original parameters to the destination lander
    url.searchParams.forEach((val, key) => {
      dest.searchParams.set(key, val);
    });

    return Response.redirect(dest.toString(), 302);
    
  } catch (err) {
    console.error("Tracker Error:", err);
    return new Response("Internal Tracker Error", { status: 500 });
  }
}
