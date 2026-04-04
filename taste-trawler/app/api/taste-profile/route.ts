import { NextResponse } from 'next/server';
import { buildTasteProfile } from '@/lib/ai/taste-profile';

export async function GET() {
  const profile = await buildTasteProfile();
  return NextResponse.json(profile);
}
