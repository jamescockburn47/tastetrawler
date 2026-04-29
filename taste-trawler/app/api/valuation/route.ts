import { NextRequest, NextResponse } from 'next/server';
import { buildValuation, buildValuationQuery } from '@/lib/valuation/engine';
import { searchEbay, EbayClientError } from '@/lib/ebay/client';
import { db } from '@/lib/db';
import { comparableSales } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import type { CompResult } from '@/lib/ebay/types';

export async function POST(request: NextRequest) {
  const { analysis, comps, buyPrice, limit } = await request.json();
  if (!analysis) {
    return NextResponse.json({ error: 'analysis required' }, { status: 400 });
  }

  const query = buildValuationQuery(analysis);
  const errors: { source: string; message: string }[] = [];
  let resolvedComps: CompResult[] = Array.isArray(comps) ? comps : [];

  if (!resolvedComps.length && query) {
    const tasks = [
      searchEbay(query, limit ?? 10).catch((err) => {
        errors.push({ source: 'ebay', message: err instanceof EbayClientError ? err.message : String(err) });
        return [] as CompResult[];
      }),
      fetchCachedVintedComps(query).catch((err) => {
        errors.push({ source: 'vinted', message: err instanceof Error ? err.message : String(err) });
        return [] as CompResult[];
      }),
    ];
    const [ebay, vinted] = await Promise.all(tasks);
    resolvedComps = [...ebay, ...vinted];
  }

  const valuation = buildValuation(analysis, resolvedComps, buyPrice ?? null);
  return NextResponse.json({ ...valuation, ...(errors.length ? { errors } : {}) });
}

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
