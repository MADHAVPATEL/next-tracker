export const runtime = 'edge';

/**
 * DYNAMIC CAMPAIGN TRACKER (/[slug])
 * Captures all defined parameters and logs them to Analytics Engine for detailed reporting.
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
      return new Response("Not Found", { status: 404 });
    }

    const campaign = JSON.parse(campaignData);
    const clickId = crypto.randomUUID();

    // 1. Capture dynamic parameters from Traffic Source
    let paramConfig = [];
    try {
        paramConfig = typeof campaign.params === 'string' ? JSON.parse(campaign.params) : (campaign.params || []);
    } catch (e) {
        paramConfig = [];
    }

    // Map captured values for the report (Blobs 5-10)
    const capturedValues = paramConfig.map((p: any) => url.searchParams.get(p.key) || "none");

    // 2. Log Visit to Analytics Engine with ALL Captured Params
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          slug,           // blob1: campaign
          "visit",        // blob2: type
          clickId,        // blob3: click_id
          // @ts-ignore
          request.cf?.country || "XX", // blob4: geo
          capturedValues[0] || "none", // blob5: Custom Param 1
          capturedValues[1] || "none", // blob6: Custom Param 2
          capturedValues[2] || "none", // blob7: Custom Param 3
          capturedValues[3] || "none", // blob8: Custom Param 4
          capturedValues[4] || "none", // blob9: Custom Param 5
          capturedValues[5] || "none", // blob10: Custom Param 6
        ],
        doubles: [1],
        indexes: [slug]
      });
    }

    // 3. Construct Destination URL (Lander)
    const dest = new URL(campaign.lander_url);
    dest.searchParams.set("cid", clickId);
    dest.searchParams.set("cmp", slug);
    
    // Forward all original parameters to the lander
    url.searchParams.forEach((val, key) => {
      dest.searchParams.set(key, val);
    });

    return Response.redirect(dest.toString(), 302);
    
  } catch (err) {
    console.error("Tracker Error:", err);
    return new Response("Tracker Error", { status: 500 });
  }
}
