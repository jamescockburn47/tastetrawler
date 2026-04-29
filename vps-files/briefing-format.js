const DAY_MS = 24 * 60 * 60 * 1000;

function money(pence) {
  if (typeof pence !== 'number') return 'unknown';
  return `£${(pence / 100).toFixed(2)}`;
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function daysListed(item, now = Date.now()) {
  if (!item?.listedAt) return null;
  return Math.floor((now - new Date(item.listedAt).getTime()) / DAY_MS);
}

function saleProfit(sale) {
  if (typeof sale.profit === 'number') return sale.profit;
  if (typeof sale.netProceeds === 'number' && typeof sale.buyPriceAtSale === 'number') {
    return sale.netProceeds - sale.buyPriceAtSale;
  }
  if (typeof sale.salePrice === 'number' && typeof sale.buyPriceAtSale === 'number') {
    return sale.salePrice - sale.buyPriceAtSale;
  }
  return null;
}

function saleTitle(sale) {
  return sale.title || sale.itemTitle || sale.notes || 'Unmatched sale';
}

function formatRecentSales(sales) {
  if (!sales.length) return 'No confirmed sales logged overnight. Calm, or suspiciously calm.';

  const lines = sales.slice(0, 4).map((sale) => {
    const profit = saleProfit(sale);
    const profitText = profit == null ? 'profit unknown' : `${money(profit)} profit`;
    return `• ${saleTitle(sale)} — ${money(sale.salePrice)} sold, ${profitText}`;
  });
  if (sales.length > 4) lines.push(`• plus ${sales.length - 4} more`);
  return lines.join('\n');
}

function formatStaleItems(staleItems) {
  if (!staleItems.length) return 'No stale listings. Miracles do occur.';

  const lines = staleItems.slice(0, 4).map((item) => {
    const age = daysListed(item);
    const views = item.views ?? 0;
    const likes = item.likes ?? 0;
    const engagement = `${views} views, ${likes} likes`;
    const advice = likes === 0 && views < 25 ? 'photo/title problem' : 'price or timing problem';
    return `• ${item.title || 'Untitled'} — ${age ?? '?'}d, ${engagement}; ${advice}`;
  });
  if (staleItems.length > 4) lines.push(`• plus ${staleItems.length - 4} more loiterers`);
  return lines.join('\n');
}

function formatDataGaps({ pendingSales, missingBuyPrice }) {
  const gaps = [];
  if (pendingSales.length) gaps.push(`${plural(pendingSales.length, 'pending sale')} needs review`);
  if (missingBuyPrice.length) gaps.push(`${plural(missingBuyPrice.length, 'sold item')} missing buy price`);
  return gaps.length ? gaps.join('; ') + '. The ledger is judging us quietly.' : 'No obvious ledger gaps. Disturbingly tidy.';
}

export function buildMorningBriefingText({
  stats,
  recentSales = [],
  staleItems = [],
  pendingSales = [],
  missingBuyPrice = [],
  auditErrors = [],
  tidyLine = null,
}) {
  const lines = ['*Morning briefing.*'];

  if (stats?.error) {
    lines.push(`\n*Sales yesterday*\nStats unavailable: ${stats.error}`);
  } else {
    const sold = stats?.itemsSold ?? 0;
    const summary = sold
      ? `${sold} sold · ${money(stats.revenue)} revenue · ${money(stats.profit)} profit · ${stats.margin ?? 0}% margin · avg ${stats.avgDaysToSell ?? 0}d to sell.`
      : 'Nothing sold in the last 24h. Rude, but not illegal.';
    lines.push(`\n*Sales yesterday*\n${summary}`);
    if (stats?.bestFlip?.title) {
      lines.push(`Best flip: ${stats.bestFlip.title} — ${money(stats.bestFlip.margin)} (${stats.bestFlip.marginPct ?? 0}%).`);
    }
  }

  lines.push(`\n*What sold*\n${formatRecentSales(recentSales)}`);

  const staleCount = staleItems.length || stats?.staleListings || 0;
  lines.push(
    `\n*Stock watch*\n${stats?.activeListings ?? 0} live listings · ${staleCount} stale.\n${formatStaleItems(staleItems)}`,
  );

  lines.push(`\n*Admin gremlins*\n${formatDataGaps({ pendingSales, missingBuyPrice })}`);

  if (tidyLine) lines.push(`\n*Overnight tidy*\n${tidyLine}`);

  if (auditErrors.length) {
    const sample = auditErrors.slice(0, 3).map((row) => `• ${row.tool}: ${row.error}`).join('\n');
    lines.push(`\n*Errors*\n${plural(auditErrors.length, 'tool error')} overnight.\n${sample}`);
  } else {
    lines.push('\n*Errors*\nNo tool errors overnight. The machines behaved, suspiciously.');
  }

  lines.push('\n*Suggested move*\nStart with stale items that have views but no sale, then clear pending sale drafts before the numbers start lying.');

  return lines.join('\n');
}
