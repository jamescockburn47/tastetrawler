import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface TasteProfile {
  topColours: { colour: string; count: number; pct: number }[];
  topCategories: { category: string; count: number; avgMargin: number }[];
  topBrands: { brand: string; count: number; avgMargin: number }[];
  topStyleTags: { tag: string; count: number }[];
  totalSold: number;
  avgMargin: number;
  avgDaysToSell: number;
}

export async function buildTasteProfile(): Promise<TasteProfile> {
  const soldItems = await db.select().from(items).where(eq(items.status, 'sold'));
  const totalSold = soldItems.length;

  if (totalSold === 0) {
    return { topColours: [], topCategories: [], topBrands: [], topStyleTags: [], totalSold: 0, avgMargin: 0, avgDaysToSell: 0 };
  }

  const colourCounts: Record<string, number> = {};
  for (const item of soldItems) {
    for (const colour of (item.colours ?? [])) {
      colourCounts[colour] = (colourCounts[colour] ?? 0) + 1;
    }
  }
  const topColours = Object.entries(colourCounts)
    .sort(([, a], [, b]) => b - a).slice(0, 8)
    .map(([colour, count]) => ({ colour, count, pct: Math.round((count / totalSold) * 100) }));

  const categoryData: Record<string, { count: number; totalMargin: number }> = {};
  for (const item of soldItems) {
    const cat = item.category ?? 'Other';
    if (!categoryData[cat]) categoryData[cat] = { count: 0, totalMargin: 0 };
    categoryData[cat].count++;
    if (item.soldPrice && item.buyPrice) categoryData[cat].totalMargin += item.soldPrice - item.buyPrice;
  }
  const topCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b.count - a.count).slice(0, 6)
    .map(([category, data]) => ({ category, count: data.count, avgMargin: data.count > 0 ? Math.round(data.totalMargin / data.count) : 0 }));

  const brandCounts: Record<string, { count: number; totalMargin: number }> = {};
  for (const item of soldItems) {
    const brand = item.brand ?? 'Unknown';
    if (!brandCounts[brand]) brandCounts[brand] = { count: 0, totalMargin: 0 };
    brandCounts[brand].count++;
    if (item.soldPrice && item.buyPrice) brandCounts[brand].totalMargin += item.soldPrice - item.buyPrice;
  }
  const topBrands = Object.entries(brandCounts)
    .filter(([brand]) => brand !== 'Unknown')
    .sort(([, a], [, b]) => b.count - a.count).slice(0, 6)
    .map(([brand, data]) => ({ brand, count: data.count, avgMargin: data.count > 0 ? Math.round(data.totalMargin / data.count) : 0 }));

  const tagCounts: Record<string, number> = {};
  for (const item of soldItems) {
    for (const tag of (item.styleTags ?? [])) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const topStyleTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a).slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const margins = soldItems.filter((i) => i.soldPrice && i.buyPrice).map((i) => i.soldPrice! - i.buyPrice!);
  const avgMargin = margins.length > 0 ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : 0;

  const sellDays = soldItems.filter((i) => i.soldAt && i.listedAt)
    .map((i) => (new Date(i.soldAt!).getTime() - new Date(i.listedAt!).getTime()) / (1000 * 60 * 60 * 24));
  const avgDaysToSell = sellDays.length > 0 ? Math.round((sellDays.reduce((a, b) => a + b, 0) / sellDays.length) * 10) / 10 : 0;

  return { topColours, topCategories, topBrands, topStyleTags, totalSold, avgMargin, avgDaysToSell };
}
