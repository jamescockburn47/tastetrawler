import { NextRequest, NextResponse } from 'next/server';
import { searchEbay, EbayClientError } from '@/lib/ebay/client';
import { db } from '@/lib/db';
import { comparableSales } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { CompResult } from '@/lib/ebay/types';

export async function POST(request: NextRequest) {
  const { query, sources, limit } = await request.json();

  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  const requestedSources: string[] = sources ?? ['ebay'];
  const errors: { source: string; message: string }[] = [];
  const allResults: CompResult[] = [];

  // Fan out to all requested sources in parallel
  const tasks: Promise<void>[] = [];

  if (requestedSources.includes('ebay')) {
    tasks.push(
      searchEbay(query, limit ?? 10)
        .then((results) => { allResults.push(...results); })
        .catch((err) => {
          if (err instanceof EbayClientError) {
            console.error('[api/comps] EbayClientError', {
              stage: err.stage, status: err.status, message: err.message, body: err.body,
            });
            errors.push({ source: 'ebay', message: err.message });
          } else {
            console.error('[api/comps] eBay unexpected error', err);
            errors.push({ source: 'ebay', message: err instanceof Error ? err.message : String(err) });
          }
        }),
    );
  }

  if (requestedSources.includes('vinted')) {
    tasks.push(
      fetchCachedVintedComps(query)
        .then((results) => { allResults.push(...results); })
        .catch((err) => {
          console.error('[api/comps] Vinted cache error', err);
          errors.push({ source: 'vinted', message: err instanceof Error ? err.message : String(err) });
        }),
    );
  }

  await Promise.allSettled(tasks);

  // Sort: sold comps first (more reliable signal), then by price descending
  allResults.sort((a, b) => {
    if (a.isSold !== b.isSold) return a.isSold ? -1 : 1;
    return b.price - a.price;
  });

  const status = errors.length > 0 && allResults.length === 0 ? 502 : 200;
  return NextResponse.json(
    { results: allResults, ...(errors.length > 0 ? { errors } : {}) },
    { status },
  );
}

/**
 * Look up Vinted comps cached in comparable_sales by the bot.
 * Returns results pushed within the last 24 hours for the given query.
 */
async function fetchCachedVintedComps(query: string): Promise<CompResult[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(comparableSales)
    .where(
      and(
        eq(comparableSales.platform, 'vinted'),
        eq(comparableSales.searchQuery, query.toLowerCase().trim()),
        gt(comparableSales.createdAt, cutoff),
      ),
    );

  return rows.map((row) => ({
    platform: 'vinted' as const,
    title: row.itemTitle,
    price: row.soldPrice ?? 0,
    url: row.url ?? '',
    imageUrl: '',
    condition: '',
    seller: '',
    isSold: row.isSold === 'true',
  }));
}
