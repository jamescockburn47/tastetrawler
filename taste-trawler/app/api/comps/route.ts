import { NextRequest, NextResponse } from 'next/server';
import { searchEbay, EbayClientError } from '@/lib/ebay/client';

export async function POST(request: NextRequest) {
  const { query, limit } = await request.json();

  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  try {
    const results = await searchEbay(query, limit ?? 10);
    // Preserve the existing response shape the bot expects.
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof EbayClientError) {
      // Log the full detail to Vercel runtime logs for diagnosis.
      console.error('[api/comps] EbayClientError', {
        stage: err.stage,
        status: err.status,
        message: err.message,
        body: err.body,
      });
      // Return a 502 with a structured error AND an empty results array so
      // the bot's existing `results.length === 0` branch doesn't crash — but
      // include `error` so a smarter caller (or a smarter bot tool) can
      // surface "eBay is unreachable" instead of "no comps found".
      return NextResponse.json(
        {
          results: [],
          error: {
            source: 'ebay',
            stage: err.stage,
            status: err.status,
            message: err.message,
          },
        },
        { status: 502 },
      );
    }
    console.error('[api/comps] unexpected error', err);
    return NextResponse.json(
      {
        results: [],
        error: {
          source: 'server',
          message: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 },
    );
  }
}
