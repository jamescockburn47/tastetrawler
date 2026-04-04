import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sold = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sold_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price), 0)`,
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
      margin: sql<number>`sold_price - buy_price`,
      marginPct: sql<number>`case when buy_price > 0 then round((sold_price - buy_price)::numeric / buy_price * 100) else 0 end`,
    })
    .from(items)
    .where(and(eq(items.status, 'sold'), gte(items.soldAt, since)))
    .orderBy(sql`sold_price - buy_price desc`)
    .limit(1);

  const stats = sold[0];

  return NextResponse.json({
    revenue: stats.revenue,
    profit: stats.revenue - stats.cost,
    margin: stats.revenue > 0 ? Math.round(((stats.revenue - stats.cost) / stats.revenue) * 100) : 0,
    itemsSold: stats.count,
    avgDaysToSell: Math.round(stats.avgDaysToSell * 10) / 10,
    activeListings: active[0].count,
    staleListings: stale[0].count,
    bestFlip: bestFlip[0] ?? null,
  });
}
