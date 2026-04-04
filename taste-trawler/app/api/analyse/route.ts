import { NextRequest, NextResponse } from 'next/server';
import { analysePhotos } from '@/lib/ai/analyse-photos';

export async function POST(request: NextRequest) {
  const { photoUrls } = await request.json();

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return NextResponse.json({ error: 'photoUrls array required' }, { status: 400 });
  }

  const analysis = await analysePhotos(photoUrls);
  return NextResponse.json(analysis);
}
