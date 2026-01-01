/**
 * DATABASE UTILITIES (app/lib/db.ts)
 * Centralized logic for interacting with Cloudflare D1 and KV.
 */

export async function getDb() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext() as { env: CloudflareEnv };
    return env.DB;
  } catch (e) {
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
    return { get: async () => null, put: async () => {}, delete: async () => {} };
  }
}

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
    // Parse JSON params for sources
    sources: (sources.results || []).map((s: any) => ({
      ...s,
      params: typeof s.params === 'string' ? JSON.parse(s.params) : s.params
    }))
  };
}

export async function deleteRecord(table: string, id: string) {
  const db = await getDb();
  if (table === 'campaigns') {
    const kv = await getKv();
    await kv.delete(id);
  }
  return await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
}

export async function addInfrastructure(table: string, data: any) {
  const db = await getDb();
  const id = crypto.randomUUID().split('-')[0];
  
  if (table === 'traffic_sources') {
    // Data.params is an array of objects, we stringify for storage
    const paramsJson = JSON.stringify(data.params);
    return await db.prepare("INSERT INTO traffic_sources (id, name, params) VALUES (?, ?, ?)")
      .bind(id, data.name, paramsJson).run();
  }
  
  return await db.prepare(`INSERT INTO ${table} (id, name, url) VALUES (?, ?, ?)`)
    .bind(id, data.name, data.url).run();
}

export async function updateInfrastructure(table: string, id: string, data: any) {
  const db = await getDb();
  if (table === 'traffic_sources') {
    const paramsJson = JSON.stringify(data.params);
    return await db.prepare(`UPDATE traffic_sources SET name = ?, params = ? WHERE id = ?`)
      .bind(data.name, paramsJson, id).run();
  }
  return await db.prepare(`UPDATE ${table} SET name = ?, url = ? WHERE id = ?`)
    .bind(data.name, data.url, id).run();
}

export async function launchCampaign(data: {
  name: string;
  landerId: string;
  offerId: string;
  trafficSourceId: string;
}) {
  const db = await getDb();
  const kv = await getKv();
  const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const lander = await db.prepare("SELECT url FROM landers WHERE id = ?").bind(data.landerId).first() as any;
  const offer = await db.prepare("SELECT url FROM offers WHERE id = ?").bind(data.offerId).first() as any;
  const ts = await db.prepare("SELECT params FROM traffic_sources WHERE id = ?").bind(data.trafficSourceId).first() as any;

  await db.prepare("INSERT INTO campaigns (id, name, lander_id, offer_id, traffic_source_id, status) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(slug, data.name, data.landerId, data.offerId, data.trafficSourceId, "active").run();

  if (lander && offer) {
    await kv.put(slug, JSON.stringify({
      lander_url: lander.url,
      offer_url: offer.url,
      // Store the structured params JSON directly in KV for the redirect engine
      params: ts?.params || "[]",
      status: "active"
    }));
  }

  return { success: true, slug };
}
