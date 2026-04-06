import { ItemTable } from '@/components/item-table';
import { SoldTable } from '@/components/sold-table';
import { PageContainer, PageHeader } from '@/components/page-container';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq, desc, not } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const [active, sold] = await Promise.all([
    db.select().from(items).where(not(eq(items.status, 'sold'))).orderBy(desc(items.createdAt)),
    db.select().from(items).where(eq(items.status, 'sold')).orderBy(desc(items.soldAt)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Active listings and sold stock."
      />
      <div className="space-y-10">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Active — {active.length} items
          </h2>
          <ItemTable items={active} />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Sold — {sold.length} items
          </h2>
          <SoldTable items={sold} />
        </section>
      </div>
    </PageContainer>
  );
}
