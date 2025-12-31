import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request, props: any) {
  const env = props?.context?.env || {};
  const data = await request.formData();
  
  const id = crypto.randomUUID().split('-')[0];
  const name = data.get('name');
  const params = data.get('params');

  await env.DB.prepare("INSERT INTO traffic_sources (id, name, params) VALUES (?, ?, ?)")
    .bind(id, name, params).run();

  return NextResponse.redirect(new URL('/dashboard/sources', request.url), 303);
}
