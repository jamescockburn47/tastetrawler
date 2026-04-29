import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items, sales } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sold = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sale_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price_at_sale), 0)`,
    })
    .from(sales)
    .where(and(eq(sales.status, 'confirmed'), gte(sales.soldAt, since)));

  const soldItemTiming = await db
    .select({
      avgDaysToSell: sql<number>`coalesce(avg(extract(epoch from (sold_at - listed_at)) / 86400), 0)`,
    })
    .from(items)
    .where(and(eq(items.status, 'sold'), gte(items.soldAt, since)));

  const active = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(eq(items.status, 'listed'));

  const stale = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(
      and(
        eq(items.status, 'listed'),
        sql`listed_at < now() - interval '14 days'`
      )
    );

  const bestFlip = await db
    .select({
      title: items.title,
      margin: sql<number>`${sales.netProceeds} - ${sales.buyPriceAtSale}`,
      marginPct: sql<number>`case when ${sales.buyPriceAtSale} > 0 then round((${sales.netProceeds} - ${sales.buyPriceAtSale})::numeric / ${sales.buyPriceAtSale} * 100) else 0 end`,
    })
    .from(sales)
    .leftJoin(items, eq(sales.itemId, items.id))
    .where(and(eq(sales.status, 'confirmed'), gte(sales.soldAt, since)))
    .orderBy(sql`${sales.netProceeds} - ${sales.buyPriceAtSale} desc`)
    .limit(1);

  const stats = sold[0];

  return NextResponse.json({
    revenue: stats.revenue,
    profit: stats.revenue - stats.cost,
    margin: stats.revenue > 0 ? Math.round(((stats.revenue - stats.cost) / stats.revenue) * 100) : 0,
    itemsSold: stats.count,
    avgDaysToSell: Math.round(soldItemTiming[0].avgDaysToSell * 10) / 10,
    activeListings: active[0].count,
    staleListings: stale[0].count,
    bestFlip: bestFlip[0] ?? null,
  });
}
