import { KpiCards } from '@/components/kpi-cards';
import { StaleItemsPanel } from '@/components/stale-items-panel';
import { PageContainer, PageHeader } from '@/components/page-container';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

async function getStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const sold = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sold_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price), 0)`,
      avgDaysToSell: sql<number>`coalesce(avg(extract(epoch from (sold_at - listed_at)) / 86400), 0)`,
    })
    .from(items)
    .where(and(eq(items.status, 'sold'), sql`sold_at >= ${since}`));

  const active = await db.select({ count: sql<number>`count(*)` }).from(items).where(eq(items.status, 'listed'));
  const stale = await db.select({ count: sql<number>`count(*)` }).from(items).where(and(eq(items.status, 'listed'), sql`listed_at < now() - interval '14 days'`));

  const bestFlip = await db
    .select({ title: items.title, margin: sql<number>`sold_price - buy_price`, marginPct: sql<number>`case when buy_price > 0 then round((sold_price - buy_price)::numeric / buy_price * 100) else 0 end` })
    .from(items)
    .where(and(eq(items.status, 'sold'), sql`sold_at >= ${since}`))
    .orderBy(sql`sold_price - buy_price desc`)
    .limit(1);

  const s = sold[0];
  return {
    revenue: s.revenue, profit: s.revenue - s.cost,
    margin: s.revenue > 0 ? Math.round(((s.revenue - s.cost) / s.revenue) * 100) : 0,
    itemsSold: s.count, avgDaysToSell: Math.round(s.avgDaysToSell * 10) / 10,
    activeListings: active[0].count, staleListings: stale[0].count,
    bestFlip: bestFlip[0] ?? null,
  };
}

async function getStaleItems() {
  return db.select().from(items)
    .where(and(eq(items.status, 'listed'), sql`listed_at < now() - interval '14 days'`))
    .orderBy(desc(items.listedAt)).limit(5);
}

export default async function DashboardPage() {
  const [stats, staleItems] = await Promise.all([getStats(), getStaleItems()]);
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Stock, sales, and the stale-items panel — the numbers MG runs the shop on."
      />
      <div className="space-y-6">
        <KpiCards stats={stats} />
        <StaleItemsPanel items={staleItems} />
      </div>
    </PageContainer>
  );
}
