import { ItemTable } from '@/components/item-table';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export default async function InventoryPage() {
  const allItems = await db.select().from(items).orderBy(desc(items.createdAt));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">{allItems.length} items</p>
      </div>
      <ItemTable items={allItems} />
    </div>
  );
}
