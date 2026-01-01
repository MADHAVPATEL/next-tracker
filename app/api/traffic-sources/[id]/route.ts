import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const db = await getDb();
    const source = await db.prepare("SELECT params FROM traffic_sources WHERE id = ?").bind(id).first();
    
    if (!source) {
      return NextResponse.json({ error: 'Traffic source not found' }, { status: 404 });
    }
    
    // @ts-ignore
    const parsedParams = JSON.parse(source.params || '[]');
    return NextResponse.json(parsedParams);

  } catch (error) {
    console.error(`Error fetching traffic source ${id}:`, error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
