export function formatEvaluation(analysis, comps) {
  const brand = analysis.brand ? `*${analysis.brand}*` : 'Unknown brand';
  const era = analysis.era ? `, ${analysis.era}` : '';
  const colours = (analysis.colours || []).join(', ');

  const avgPrice = comps.length > 0
    ? Math.round(comps.reduce((s, c) => s + c.price, 0) / comps.length)
    : null;

  let msg = `${brand}${era} · ${analysis.category}\n`;
  msg += `${colours} · ${analysis.condition} · ${analysis.material || 'unknown material'}\n`;
  msg += `Story potential: ${analysis.storyPotentialScore}/10\n\n`;

  if (avgPrice) {
    msg += `Avg comp price: *£${(avgPrice / 100).toFixed(2)}*\n`;
    const lines = comps.slice(0, 3).map(c => `  ${c.title}: £${(c.price / 100).toFixed(2)}`);
    msg += `Comps:\n${lines.join('\n')}\n`;
  } else {
    msg += 'No comparable sales found.\n';
  }

  return msg;
}

export function formatQuickList(listing) {
  return `Saved to inventory:\n*${listing.title}*\nSuggested price: £${(listing.suggestedPrice / 100).toFixed(2)}\n\nReview in the app when ready.`;
}

export function formatStats(stats) {
  let msg = `*This month*\n`;
  msg += `Revenue: £${(stats.revenue / 100).toFixed(2)}\n`;
  msg += `Profit: £${(stats.profit / 100).toFixed(2)} (${stats.margin}% margin)\n`;
  msg += `Sold: ${stats.itemsSold} items (avg ${stats.avgDaysToSell}d)\n`;
  msg += `Active: ${stats.activeListings} listed`;
  if (stats.staleListings > 0) msg += ` (${stats.staleListings} stale)`;
  if (stats.bestFlip) {
    msg += `\nBest flip: ${stats.bestFlip.title} — £${(stats.bestFlip.margin / 100).toFixed(2)} (${stats.bestFlip.marginPct}%)`;
  }
  return msg;
}

export function formatStaleItems(items) {
  if (items.length === 0) return 'Nothing stale right now.';
  const lines = items.map(item => {
    const days = Math.floor((Date.now() - new Date(item.listedAt).getTime()) / 86400000);
    return `  ${item.title || 'Untitled'} — ${days}d, ${item.views} views, ${item.likes} likes`;
  });
  return `*Stale items (14+ days):*\n${lines.join('\n')}`;
}
