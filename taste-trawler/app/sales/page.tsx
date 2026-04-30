import { desc, inArray } from 'drizzle-orm';
import { PageContainer, PageHeader } from '@/components/page-container';
import { SalesReview } from '@/components/sales-review';
import { db } from '@/lib/db';
import { items, sales } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const saleRows = await db.select().from(sales).orderBy(desc(sales.createdAt));
  const itemIds = saleRows.map((sale) => sale.itemId).filter((id): id is string => Boolean(id));
  const linkedItems = itemIds.length
    ? await db.select().from(items).where(inArray(items.id, itemIds))
    : [];
  const itemById = new Map(linkedItems.map((item) => [item.id, item]));

  const rows = saleRows.map((sale) => {
    const item = sale.itemId ? itemById.get(sale.itemId) : null;
    return {
      id: sale.id,
      itemId: sale.itemId,
      title: item?.title || sale.notes || 'Unmatched sale',
      photo: item?.photos?.[0] ?? null,
      salePrice: sale.salePrice,
      buyPriceAtSale: sale.buyPriceAtSale,
      netProceeds: sale.netProceeds,
      platform: sale.platform,
      soldAt: sale.soldAt?.toISOString() ?? null,
      status: sale.status,
      confidence: sale.confidence,
      notes: sale.notes,
    };
  });

  const needsReview = rows.filter((row) => row.status !== 'confirmed' && row.status !== 'void').length;

  return (
    <PageContainer>
      <PageHeader
        title="Sales Ledger"
        description={
          needsReview
            ? `${needsReview} sale${needsReview === 1 ? '' : 's'} need a human eyebrow before they hit the numbers. Bring receipts.`
            : 'Confirmed sales, tidy numbers, minimal accounting theatre. Disturbingly mature.'
        }
      />
      <SalesReview rows={rows} />
    </PageContainer>
  );
}
