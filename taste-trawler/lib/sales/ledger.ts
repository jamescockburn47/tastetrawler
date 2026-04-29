import { db } from '@/lib/db';
import { items, saleEvents, sales } from '@/lib/db/schema';
import type { Item } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
export { buildSaleValues, computeNetProceeds, inferSaleStatus, saleNeedsMoreInfo } from './ledger-utils';
export type { SaleDraftInput, SalePlatform, SaleStatus } from './ledger-utils';

export async function logSaleEvent(
  saleId: string,
  type: 'created' | 'updated' | 'confirmed' | 'voided' | 'linked_item' | 'linked_image',
  message: string,
  payload: Record<string, unknown> = {},
  actor = 'bot',
): Promise<void> {
  await db.insert(saleEvents).values({ saleId, type, message, payload, actor });
}

export async function syncConfirmedSaleToItem(saleId: string): Promise<Item | null> {
  const [sale] = await db.select().from(sales).where(eq(sales.id, saleId));
  if (!sale?.itemId) return null;

  const patch: {
    status: 'sold';
    soldPrice: number | null;
    soldAt: Date;
    updatedAt: Date;
    buyPrice?: number;
  } = {
    status: 'sold',
    soldPrice: sale.salePrice,
    soldAt: sale.soldAt ?? new Date(),
    updatedAt: new Date(),
  };
  if (sale.buyPriceAtSale != null) patch.buyPrice = sale.buyPriceAtSale;

  const [updated] = await db
    .update(items)
    .set(patch)
    .where(eq(items.id, sale.itemId))
    .returning();

  return updated ?? null;
}
