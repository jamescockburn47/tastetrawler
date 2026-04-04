import { NextRequest, NextResponse } from 'next/server';
import { searchEbay } from '@/lib/ebay/client';

export async function POST(request: NextRequest) {
  const { query, limit } = await request.json();

  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  const results = await searchEbay(query, limit ?? 10);
  return NextResponse.json({ results });
}
