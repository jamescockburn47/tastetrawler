import { NextRequest, NextResponse } from 'next/server';
import { generateListing } from '@/lib/ai/generate-listing';

export async function POST(request: NextRequest) {
  const { analysis, comps } = await request.json();

  if (!analysis) {
    return NextResponse.json({ error: 'analysis required' }, { status: 400 });
  }

  const listing = await generateListing(analysis, comps ?? []);
  return NextResponse.json(listing);
}
