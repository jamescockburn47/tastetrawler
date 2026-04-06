import { KpiCards } from '@/components/kpi-cards';
import { StaleItemsPanel } from '@/components/stale-items-panel';
import { PageContainer, PageHeader } from '@/components/page-container';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [sold30, soldAllTime, active, stale] = await Promise.all([
    // 30-day sold window
    db.select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sold_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price), 0)`,
      withCost: sql<number>`count(*) filter (where buy_price is not null)`,
      avgDaysToSell: sql<number>`coalesce(avg(extract(epoch from (sold_at - listed_at)) / 86400), 0)`,
    }).from(items).where(and(eq(items.status, 'sold'), sql`sold_at >= ${since}`)),

    // All-time sold
    db.select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sold_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price), 0)`,
      withCost: sql<number>`count(*) filter (where buy_price is not null)`,
    }).from(items).where(eq(items.status, 'sold')),

    db.select({ count: sql<number>`count(*)` }).from(items).where(eq(items.status, 'listed')),

    db.select({ count: sql<number>`count(*)` }).from(items).where(
      and(eq(items.status, 'listed'), sql`listed_at < now() - interval '14 days'`)
    ),
  ]);

  const s30 = sold30[0];
  const sAll = soldAllTime[0];

  return {
    // 30-day
    revenue30: s30.revenue,
    profit30: s30.revenue - s30.cost,
    profitKnown30: s30.withCost,
    itemsSold30: s30.count,
    avgDaysToSell: Math.round(s30.avgDaysToSell * 10) / 10,
    // All-time
    revenueAll: sAll.revenue,
    profitAll: sAll.revenue - sAll.cost,
    profitKnownAll: sAll.withCost,
    itemsSoldAll: sAll.count,
    // Stock
    activeListings: active[0].count,
    staleListings: stale[0].count,
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
        description="Stock, sales, and the stale-items panel."
      />
      <div className="space-y-6">
        <KpiCards stats={stats} />
        <StaleItemsPanel items={staleItems} />
      </div>
    </PageContainer>
  );
}
