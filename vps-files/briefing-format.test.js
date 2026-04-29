import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMorningBriefingText } from './briefing-format.js';

test('buildMorningBriefingText includes accurate sales, stale, pending, audit, and tidy signals', () => {
  const text = buildMorningBriefingText({
    stats: {
      itemsSold: 2,
      revenue: 5800,
      profit: 4200,
      margin: 72,
      avgDaysToSell: 4.5,
      activeListings: 17,
      staleListings: 3,
      bestFlip: { title: 'Green leather bag', margin: 2400, marginPct: 300 },
    },
    recentSales: [
      { title: 'Green leather bag', salePrice: 3200, buyPriceAtSale: 800, profit: 2400, soldAt: Date.now() },
      { title: 'Ceramic bowl', salePrice: 2600, buyPriceAtSale: 800, profit: 1800, soldAt: Date.now() },
    ],
    staleItems: [
      { title: 'Blue wool coat', listedAt: Date.now() - 20 * 86400000, views: 19, likes: 0 },
      { title: 'Red scarf', listedAt: Date.now() - 16 * 86400000, views: 80, likes: 9 },
    ],
    pendingSales: [{ id: 'sale_1' }],
    missingBuyPrice: [{ title: 'Mystery blouse' }],
    auditErrors: [{ tool: 'tt_search_comps', error: 'No eBay key' }],
    tidyLine: 'Overnight tidy: 3 enriched, 1 marked sold.',
  });

  assert.match(text, /\*Morning briefing\.\*/);
  assert.match(text, /2 sold/);
  assert.match(text, /£58\.00 revenue/);
  assert.match(text, /Green leather bag/);
  assert.match(text, /2 stale/);
  assert.match(text, /1 pending sale/);
  assert.match(text, /1 sold item missing buy price/);
  assert.match(text, /1 tool error/);
  assert.match(text, /Overnight tidy: 3 enriched, 1 marked sold\./);
});
