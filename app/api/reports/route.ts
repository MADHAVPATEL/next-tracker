import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function getCfEnv(req: NextRequest) {
    // This is a placeholder for getting bindings in a real Cloudflare environment
    // In a local dev setup, you might use a .dev.vars file or similar
    // For this example, we'll return mock credentials.
    try {
        const { getRequestContext } = await import('@cloudflare/next-on-pages');
        const context = getRequestContext();
        // @ts-ignore
        return context.env;
    } catch (e) {
        console.error("Could not get Cloudflare context", e);
        return {
            CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
            CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID
        }
    }
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  let param1 = searchParams.get('param1');
  let param2 = searchParams.get('param2');
  let param3 = searchParams.get('param3');

  if (param1 === 'null') param1 = null;
  if (param2 === 'null') param2 = null;
  if (param3 === 'null') param3 = null;

  if (!campaignId || !param1) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    const env = await getCfEnv(req);
    const cfApiToken = env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = env.CLOUDFLARE_ACCOUNT_ID;

    if (!cfApiToken || !cfAccountId) {
      console.error("CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID is not set.");
      // Return mock data if credentials are not available
      return NextResponse.json(getMockData(param1, param2, param3));
    }

    const paramMap: { [key: string]: string } = {
        [param1]: 'blob3',
        ...(param2 && { [param2]: 'blob4' }),
        ...(param3 && { [param3]: 'blob5' }),
    };
    
    const selectFields = Object.keys(paramMap).map(p => `${paramMap[p]} as ${p}`).join(', ');
    const groupByFields = Object.values(paramMap).join(', ');

    const query = `
      SELECT 
        ${selectFields},
        SUM(CASE WHEN blob1 = 'visit' THEN double1 ELSE 0 END) as visits,
        SUM(CASE WHEN blob1 = 'lander_click' THEN double1 ELSE 0 END) as clicks,
        SUM(CASE WHEN blob1 = 'conversion' THEN 1 ELSE 0 END) as conversions,
        SUM(CASE WHEN blob1 = 'conversion' THEN double1 ELSE 0 END) as revenue
      FROM ClickLogs
      WHERE timestamp > NOW() - INTERVAL '30' DAY AND blob0 = '${campaignId}'
      GROUP BY ${groupByFields}
      ORDER BY visits DESC
      LIMIT 100
    `;
    
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/analytics_engine/sql`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${cfApiToken}` },
        body: query
      }
    );

    if (!res.ok) {
        const errorBody = await res.text();
        console.error("Cloudflare API Error:", res.status, errorBody);
        return NextResponse.json({ error: `Cloudflare API error: ${errorBody}` }, { status: res.status });
    }

    const json: any = await res.json();
    
    return NextResponse.json(json.data || []);

  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}

function getMockData(param1: string, param2: string | null, param3: string | null) {
    const data = [
        { [param1]: 'google', visits: 1200, clicks: 300, conversions: 15, revenue: 150.00 },
        { [param1]: 'facebook', visits: 2500, clicks: 500, conversions: 25, revenue: 250.00 },
    ];
    if(param2) {
        // @ts-ignore
        data[0][param2] = 'cpc';
        // @ts-ignore
        data[1][param2] = 'cpc';
    }
    if(param3) {
        // @ts-ignore
        data[0][param3] = 'summer-sale';
        // @ts-ignore
        data[1][param3] = 'new-users';
    }
    return data;
}
