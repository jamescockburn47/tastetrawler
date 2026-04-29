import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { isApiKeyOrClerkAuthenticated } from '@/lib/api-auth';
import { logSaleEvent, saleNeedsMoreInfo, syncConfirmedSaleToItem } from '@/lib/sales/ledger';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isApiKeyOrClerkAuthenticated(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const [sale] = await db.select().from(sales).where(eq(sales.id, id));

  if (!sale) return NextResponse.json({ error: 'not found' }, { status: 404, headers: CORS });

  const missing = saleNeedsMoreInfo({
    itemId: sale.itemId,
    salePrice: sale.salePrice,
    buyPriceAtSale: sale.buyPriceAtSale,
    soldAt: sale.soldAt,
  });

  if (missing.length > 0) {
    const [updated] = await db
      .update(sales)
      .set({ status: 'needs_review', updatedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();
    return NextResponse.json({ sale: updated, missing }, { status: 409, headers: CORS });
  }

  const now = new Date();
  const [confirmed] = await db
    .update(sales)
    .set({ status: 'confirmed', confirmedAt: now, updatedAt: now })
    .where(eq(sales.id, id))
    .returning();

  const item = await syncConfirmedSaleToItem(id);
  await logSaleEvent(id, 'confirmed', 'Sale confirmed and synced to inventory.', { itemId: item?.id }, body.actor ?? 'bot');

  return NextResponse.json({ sale: confirmed, item }, { headers: CORS });
}
