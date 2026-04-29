import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

type ItemStatus = 'draft' | 'listed' | 'sold' | 'stale' | 'archived';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') as ItemStatus | null;

  const query = db.select().from(items).orderBy(desc(items.createdAt));

  const result = status
    ? await query.where(eq(items.status, status))
    : await query;

  return NextResponse.json(result, { headers: CORS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [item] = await db.insert(items).values({
      ...body,
      buyPrice: body.buyPrice ? Math.round(body.buyPrice) : null,
      listPrice: body.listPrice ? Math.round(body.listPrice) : null,
      listedAt: body.listedAt ? new Date(body.listedAt) : null,
      soldAt: body.soldAt ? new Date(body.soldAt) : null,
    }).returning();

    return NextResponse.json(item, { status: 201, headers: CORS });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}
