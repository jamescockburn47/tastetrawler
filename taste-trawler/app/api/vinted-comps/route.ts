import { NextRequest, NextResponse } from 'next/server';
import { isApiKeyAuthenticated } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { comparableSales } from '@/lib/db/schema';

/**
 * POST /api/vinted-comps
 *
 * Receives Vinted comparable results pushed by the WhatsApp bot after
 * a Playwright scrape. Stores them in comparable_sales so the workbench
 * can read cached Vinted comps without needing a live scrape.
 *
 * Auth: Bearer TT_API_KEY
 * Body: { query: string, results: { title, price, url, isSold, condition? }[] }
 */
export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, results } = await request.json();

  if (!query || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json(
      { error: 'query (string) and results (non-empty array) required' },
      { status: 400 },
    );
  }

  const normalizedQuery = query.toLowerCase().trim();

  const rows = results.map((r: {
    title: string;
    price: number;
    url?: string;
    isSold?: boolean;
    condition?: string;
  }) => ({
    platform: 'vinted',
    itemTitle: r.title,
    soldPrice: r.price,  // pence
    isSold: r.isSold ? 'true' : 'false',
    url: r.url ?? null,
    searchQuery: normalizedQuery,
    soldAt: r.isSold ? new Date() : null,
  }));

  await db.insert(comparableSales).values(rows);

  return NextResponse.json({ cached: rows.length });
}
