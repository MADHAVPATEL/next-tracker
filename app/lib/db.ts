/**
 * DATABASE UTILITIES (app/lib/db.ts)
 * Centralized logic for interacting with Cloudflare D1 and KV.
 * Includes safety fallbacks for local/preview environments.
 */

export async function getDb() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext() as { env: CloudflareEnv };
    return env.DB;
  } catch (e) {
    // Mock for local dev/preview
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

export async function getKv() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext() as { env: CloudflareEnv };
    return env.CAMPAIGNS;
  } catch (e) {
    return { 
      get: async () => null, 
      put: async () => {}, 
      delete: async () => {} 
    };
  }
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

/**
 * GENERIC CRUD HELPERS
 */
export async function deleteRecord(table: string, id: string) {
  const db = await getDb();
  
  // If deleting a campaign, also remove from KV redirect engine
  if (table === 'campaigns') {
    const kv = await getKv();
    await kv.delete(id);
  }
  
  return await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
}

/**
 * ADD ASSET (Lander, Offer, Traffic Source)
 */
export async function addInfrastructure(table: string, data: any) {
  const db = await getDb();
  const id = crypto.randomUUID().split('-')[0];
  
  if (table === 'traffic_sources') {
    return await db.prepare("INSERT INTO traffic_sources (id, name, params) VALUES (?, ?, ?)")
      .bind(id, data.name, data.params).run();
  }
  
  return await db.prepare(`INSERT INTO ${table} (id, name, url) VALUES (?, ?, ?)`)
    .bind(id, data.name, data.url).run();
}

/**
 * CAMPAIGN ACTIONS (D1 + KV Sync)
 */
export async function launchCampaign(data: {
  name: string;
  landerId: string;
  offerId: string;
  trafficSourceId: string;
}) {
  const db = await getDb();
  const kv = await getKv();
  const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // 1. Get routing info for the redirect engine
  const lander = await db.prepare("SELECT url FROM landers WHERE id = ?").bind(data.landerId).first() as any;
  const offer = await db.prepare("SELECT url FROM offers WHERE id = ?").bind(data.offerId).first() as any;
  const ts = await db.prepare("SELECT params FROM traffic_sources WHERE id = ?").bind(data.trafficSourceId).first() as any;

  // 2. Save metadata to D1
  await db.prepare("INSERT INTO campaigns (id, name, lander_id, offer_id, traffic_source_id, status) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(slug, data.name, data.landerId, data.offerId, data.trafficSourceId, "active").run();

  // 3. Save to KV for fast edge redirects (Mapping)
  if (lander && offer) {
    await kv.put(slug, JSON.stringify({
      lander_url: lander.url,
      offer_url: offer.url,
      params: ts?.params || "",
      status: "active"
    }));
  }

  return { success: true, slug };
}
