import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { isApiKeyOrClerkAuthenticated } from '@/lib/api-auth';
import { computeNetProceeds, logSaleEvent } from '@/lib/sales/ledger';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [sale] = await db.select().from(sales).where(eq(sales.id, id));
  if (!sale) return NextResponse.json({ error: 'not found' }, { status: 404, headers: CORS });
  return NextResponse.json(sale, { headers: CORS });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isApiKeyOrClerkAuthenticated(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }

  const { id } = await params;
  const body = await request.json();
  const { actor = 'bot', ...data } = body;
  const patch = { ...data, updatedAt: new Date() };
  const priceChanged =
    'salePrice' in patch ||
    'fees' in patch ||
    'postage' in patch ||
    'discount' in patch;

  if (typeof patch.soldAt === 'string') patch.soldAt = new Date(patch.soldAt);
  if (priceChanged) {
    const [current] = await db.select().from(sales).where(eq(sales.id, id));
    if (!current) return NextResponse.json({ error: 'not found' }, { status: 404, headers: CORS });
    patch.netProceeds = computeNetProceeds({
      salePrice: patch.salePrice ?? current.salePrice,
      fees: patch.fees ?? current.fees,
      postage: patch.postage ?? current.postage,
      discount: patch.discount ?? current.discount,
    });
  }

  const [updated] = await db.update(sales).set(patch).where(eq(sales.id, id)).returning();
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404, headers: CORS });

  await logSaleEvent(id, 'updated', 'Sale details updated.', patch, actor);
  return NextResponse.json(updated, { headers: CORS });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isApiKeyOrClerkAuthenticated(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }

  const { id } = await params;
  const [updated] = await db
    .update(sales)
    .set({ status: 'void', updatedAt: new Date() })
    .where(eq(sales.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404, headers: CORS });
  await logSaleEvent(id, 'voided', 'Sale voided.', {}, 'bot');
  return NextResponse.json(updated, { headers: CORS });
}
