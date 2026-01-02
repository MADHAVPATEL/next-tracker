export const runtime = 'edge';

/**
 * CONVERSION TRACKING (/postback)
 * Called by the Affiliate Network / Offer when a sale occurs.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cid = url.searchParams.get("cid");
  const cmp = url.searchParams.get("cmp") || "unknown";
  const payout = parseFloat(url.searchParams.get("payout") || "0");

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext() as { env: CloudflareEnv };

    // Retrieve stored params for this click
    const storedParams = cid ? await env.CLICK_PARAMS.get(cid) : null;
    const params = storedParams ? JSON.parse(storedParams) : ["none", "none", "none"];

    // Log Conversion to Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          cmp, 
          "conversion", 
          cid || "no-id",
          params[0],
          params[1],
          params[2]
        ],
        doubles: [payout],
        indexes: [cmp]
      });
    }

    return new Response("OK");
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}
