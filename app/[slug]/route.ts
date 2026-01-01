export const runtime = 'edge';

/**
 * LANDER TO OFFER REDIRECT (/click)
 * Called when a user clicks the "Call to Action" on your landing page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cmp = url.searchParams.get("cmp");
  const cid = url.searchParams.get("cid");

  if (!cmp) return new Response("Missing Campaign", { status: 400 });

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext() as { env: CloudflareEnv };

    // 1. Get campaign config from KV
    const campaignData = await env.CAMPAIGNS.get(cmp);
    if (!campaignData) return new Response("Campaign Not Found", { status: 404 });

    const campaign = JSON.parse(campaignData);

    // 2. Log Lander Click to Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [cmp, "lander_click", cid || "no-id", "XX"],
        doubles: [1],
        indexes: [cmp]
      });
    }

    // 3. Construct Offer URL with CID for postback tracking
    const offerUrl = new URL(campaign.offer_url);
    offerUrl.searchParams.set("cid", cid || "no-id");
    offerUrl.searchParams.set("cmp", cmp);

    return Response.redirect(offerUrl.toString(), 302);
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}
