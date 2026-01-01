import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const context = getRequestContext();
    const env = (context?.env || {}) as any;

    return NextResponse.json({
      DB_bound: !!env.DB,
      CAMPAIGNS_bound: !!env.CAMPAIGNS,
      ANALYTICS_configured: !!(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID),
      account_id_present: !!env.CLOUDFLARE_ACCOUNT_ID,
      token_present: !!env.CLOUDFLARE_API_TOKEN,
      note: 'No secret values are returned. This endpoint only reports presence.'
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
