import { KpiCards } from '@/components/kpi-cards';
import { StaleItemsPanel } from '@/components/stale-items-panel';
import { PageContainer, PageHeader } from '@/components/page-container';
import { DailyBriefing } from '@/components/daily-briefing';
import { db } from '@/lib/db';
import { items, sales } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [sold30, soldAllTime, timing, active, stale] = await Promise.all([
    // 30-day sold window
    db.select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sale_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price_at_sale), 0)`,
      withCost: sql<number>`count(*) filter (where buy_price_at_sale is not null)`,
    }).from(sales).where(and(eq(sales.status, 'confirmed'), sql`${sales.soldAt} >= ${since}`)),

    // All-time sold
    db.select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sale_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price_at_sale), 0)`,
      withCost: sql<number>`count(*) filter (where buy_price_at_sale is not null)`,
    }).from(sales).where(eq(sales.status, 'confirmed')),

    db.select({
      avgDaysToSell: sql<number>`coalesce(avg(extract(epoch from (sold_at - listed_at)) / 86400), 0)`,
    }).from(items).where(and(eq(items.status, 'sold'), sql`sold_at >= ${since}`)),

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
    avgDaysToSell: Math.round(timing[0].avgDaysToSell * 10) / 10,
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
        description="Sales, stock, and the items quietly embarrassing themselves."
      />
      <div className="space-y-6">
        <DailyBriefing stats={stats} />
        <KpiCards stats={stats} />
        <StaleItemsPanel items={staleItems} />
      </div>
    </PageContainer>
  );
}
