import { ItemTable } from '@/components/item-table';
import { PageContainer, PageHeader } from '@/components/page-container';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export default async function InventoryPage() {
  const allItems = await db.select().from(items).orderBy(desc(items.createdAt));
  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Everything listed, sold, and sitting. Sortable."
      />
      <ItemTable items={allItems} />
    </PageContainer>
  );
}
