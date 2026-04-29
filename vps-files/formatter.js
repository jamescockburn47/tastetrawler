export function formatEvaluation(analysis, comps, valuation = null) {
  const brand = analysis.brand ? `*${analysis.brand}*` : 'Unknown brand';
  const era = analysis.era ? `, ${analysis.era}` : '';
  const colours = (analysis.colours || []).join(', ');

  const avgPrice = comps.length > 0
    ? Math.round(comps.reduce((s, c) => s + c.price, 0) / comps.length)
    : null;

  let msg = `${brand}${era} · ${analysis.category}\n`;
  msg += `${colours} · ${analysis.condition} · ${analysis.material || 'unknown material'}\n`;
  msg += `Story potential: ${analysis.storyPotentialScore}/10\n\n`;

  if (valuation?.targetPrice) {
    msg += `List around: *£${(valuation.targetPrice / 100).toFixed(2)}*`;
    const band = [];
    if (valuation.quickSalePrice) band.push(`quick: £${(valuation.quickSalePrice / 100).toFixed(2)}`);
    if (valuation.patientPrice) band.push(`patient: £${(valuation.patientPrice / 100).toFixed(2)}`);
    if (band.length) msg += ` (${band.join(', ')})`;
    msg += `\nConfidence: *${valuation.confidence}*\n`;
    if (valuation.maxBuyPrice) msg += `Max buy price: £${(valuation.maxBuyPrice / 100).toFixed(2)}\n`;
    msg += `${valuation.reasoning}\n\n`;
  }

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
  const price = listing.valuation?.targetPrice ?? listing.suggestedPrice;
  const confidence = listing.valuation?.confidence ? ` (${listing.valuation.confidence} confidence)` : '';
  return `Saved to inventory:\n*${listing.title}*\nSuggested price: £${(price / 100).toFixed(2)}${confidence}\n\nReview in the app when ready.`;
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

function formatMoney(pence) {
  if (pence == null) return null;
  return `£${(pence / 100).toFixed(2)}`;
}

function nextSaleQuestion(missing = []) {
  if (missing.includes('which item sold')) return 'Which item was it? Give me a title, Vinted id, or point me at the photo. I do require *some* clues, tragically.';
  if (missing.includes('sale price')) return 'What did it sell for? Actual pounds, not manifestation pounds.';
  if (missing.includes('sold date')) return 'When did it sell? Today is fine if it was today.';
  if (missing.includes('buy price')) return 'What did MG pay for it? I need this for profit, otherwise the maths becomes vibes in a trench coat.';
  return null;
}

export function formatSaleDraft(result) {
  const sale = result.sale ?? result;
  const missing = result.missing ?? [];
  const lines = ['*Sale draft started.*'];
  if (sale.id) lines.push(`id: ${sale.id}`);
  if (sale.salePrice != null) lines.push(`Sold for: *${formatMoney(sale.salePrice)}*`);
  if (sale.buyPriceAtSale != null) lines.push(`Bought for: ${formatMoney(sale.buyPriceAtSale)}`);
  if (sale.netProceeds != null) lines.push(`Net before buy price: ${formatMoney(sale.netProceeds)}`);
  if (sale.platform) lines.push(`Platform: ${sale.platform}`);
  const next = nextSaleQuestion(missing);
  if (next) lines.push('', next);
  else lines.push('', 'I have enough. Reply with confirm and I’ll log it properly.');
  return lines.join('\n');
}

export function formatSaleUpdated(result) {
  return formatSaleDraft(result);
}

export function formatSaleConfirmed(result) {
  const sale = result.sale ?? result;
  const profit = sale.salePrice != null && sale.buyPriceAtSale != null
    ? sale.salePrice - sale.buyPriceAtSale - (sale.fees ?? 0) - (sale.postage ?? 0) - (sale.discount ?? 0)
    : null;
  return [
    '*Sale logged.* Spreadsheet gods fed.',
    sale.salePrice != null ? `Sold for: *${formatMoney(sale.salePrice)}*` : null,
    profit != null ? `Profit: *${formatMoney(profit)}*` : 'Profit: unknown until buy price is filled in. Rude, but survivable.',
  ].filter(Boolean).join('\n');
}
