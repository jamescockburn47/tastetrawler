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
        title="The Rails"
        description="Active listings, sold stock, and the odd item still waiting for its main character moment."
      />
      <div className="space-y-10">
        <section>
          <h2 className="section-kicker mb-3">
            Active — {active.length} items
          </h2>
          <ItemTable items={active} />
        </section>
        <section>
          <h2 className="section-kicker mb-3">
            Sold — {sold.length} items
          </h2>
          <SoldTable items={sold} />
        </section>
      </div>
    </PageContainer>
  );
}
