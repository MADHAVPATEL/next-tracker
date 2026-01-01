/**
 * DATABASE UTILITIES (app/lib/db.ts)
 * Centralized logic for interacting with Cloudflare D1.
 * Includes safety fallbacks for local/preview environments.
 */

export async function getDb() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    return env.DB;
  } catch (e) {
    // In local dev or preview, we return a mock interface
    // to prevent crashes while you build the UI.
    return {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          all: async () => ({ results: [], success: true }),
          first: async () => null,
          run: async () => ({ success: true })
        }),
        all: async () => ({ results: [], success: true }),
        first: async () => null,
        run: async () => ({ success: true })
      })
    };
  }
}

/**
 * CAMPAIGN ACTIONS
 */
export async function createCampaign(data: {
  name: string;
  landerId: string;
  offerId: string;
  trafficSourceId: string;
}) {
  const db = await getDb();
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return await db
    .prepare(
      "INSERT INTO campaigns (id, name, lander_id, offer_id, traffic_source_id, status) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(slug, data.name, data.landerId, data.offerId, data.trafficSourceId, "active")
    .run();
}

/**
 * INFRASTRUCTURE FETCHERS
 */
export async function getInfrastructureData() {
  const db = await getDb();
  
  const [landers, offers, sources] = await Promise.all([
    db.prepare("SELECT * FROM landers ORDER BY id DESC").all(),
    db.prepare("SELECT * FROM offers ORDER BY id DESC").all(),
    db.prepare("SELECT * FROM traffic_sources ORDER BY id DESC").all(),
  ]);

  return {
    landers: landers.results || [],
    offers: offers.results || [],
    sources: sources.results || []
  };
}
