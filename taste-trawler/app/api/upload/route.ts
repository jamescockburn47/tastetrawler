import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('photos') as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const urls: string[] = [];

  for (const file of files) {
    const blob = await put(`items/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });
    urls.push(blob.url);
  }

  return NextResponse.json({ urls });
}
