import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export const runtime = 'edge';

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT id, name, traffic_source_id FROM campaigns ORDER BY name").all();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
