import {
  analysePhotos,
  searchComps,
  generateListing,
  createItem,
  buildValuation,
  getStats,
  getItems,
  patchItem,
  searchChatImages,
  createSale,
  patchSale,
  confirmSale,
} from './tt-api.js';
import {
  formatEvaluation,
  formatQuickList,
  formatStats,
  formatStaleItems,
  formatSaleDraft,
  formatSaleUpdated,
  formatSaleConfirmed,
} from './formatter.js';
import { tidyInventory, backfillFromVinted, enrichWithGemini, syncWithVinted } from './admin-tools.js';
import { logTool } from './db.js';

export { toolDefinitions } from './tool-definitions.js';

// Public entry point — wraps the raw switch in audit logging so every tool
// call lands in the `audit` table whether it succeeded or blew up.
export async function handleTool(name, input) {
  const started = Date.now();
  try {
    const output = await dispatchTool(name, input);
    logTool(name, input, output, Date.now() - started);
    return output;
  } catch (err) {
    logTool(name, input, null, Date.now() - started, err?.message || String(err));
    throw err;
  }
}

async function dispatchTool(name, input) {
  switch (name) {
    case 'tt_evaluate_item': {
      const analysis = await analysePhotos(input.photoUrls);
      const query = marketQuery(analysis);
      const comps = query ? (await searchComps(query)).results : [];
      const valuation = await buildValuation(analysis, comps).catch(() => null);
      return formatEvaluation(analysis, comps, valuation);
    }

    case 'tt_quick_list': {
      const analysis = await analysePhotos(input.photoUrls);
      const query = marketQuery(analysis);
      const compsRes = query ? await searchComps(query) : { results: [] };
      const valuation = await buildValuation(analysis, compsRes.results, input.buyPrice ?? null).catch(() => null);
      const listing = await generateListing(analysis, compsRes.results);
      await createItem({
        photos: input.photoUrls,
        title: listing.title,
        description: listing.description,
        brand: analysis.brand,
        category: analysis.category,
        condition: analysis.condition,
        era: analysis.era,
        colours: analysis.colours,
        styleTags: analysis.styleTags,
        material: analysis.material,
        size: analysis.size,
        storyPotentialScore: analysis.storyPotentialScore,
        listPrice: listing.suggestedPrice,
        buyPrice: input.buyPrice ?? null,
        status: 'draft',
      });
      return formatQuickList({ ...listing, valuation });
    }

    case 'tt_stats': {
      const stats = await getStats(input.days ?? 30);
      return formatStats(stats);
    }

    case 'tt_stale_items': {
      const items = await getItems('listed');
      const stale = items.filter(i => {
        if (!i.listedAt) return false;
        return (Date.now() - new Date(i.listedAt).getTime()) / 86400000 >= 14;
      });
      return formatStaleItems(stale);
    }

    case 'tt_search_comps': {
      const { results } = await searchComps(input.query);
      if (results.length === 0) return 'No comparable items found on eBay.';
      return `*eBay comps for "${input.query}":*\n` +
        results.slice(0, 5).map(c => `  ${c.title}: £${(c.price / 100).toFixed(2)} (${c.condition})`).join('\n');
    }

    case 'tt_add_buy_price': {
      const all = await getItems();
      const match = all.find(i => i.title?.toLowerCase().includes(input.itemTitle.toLowerCase()));
      if (!match) return `Could not find "${input.itemTitle}".`;
      await patchItem(match.id, { buyPrice: input.buyPrice });
      const margin = match.listPrice ? match.listPrice - input.buyPrice : null;
      return `Updated *${match.title}* buy price to £${(input.buyPrice / 100).toFixed(2)}.${margin ? ` Est. margin: £${(margin / 100).toFixed(2)}` : ''}`;
    }

    case 'tt_start_sale_log': {
      const item = await resolveSaleItem(input);
      const draft = await createSale({
        ...input,
        itemId: input.itemId ?? item?.id ?? null,
        buyPriceAtSale: input.buyPriceAtSale ?? item?.buyPrice ?? null,
        source: 'whatsapp',
      });
      return formatSaleDraft(draft);
    }

    case 'tt_answer_sale_question': {
      const item = await resolveSaleItem(input);
      const patch = {
        ...input,
        itemId: input.itemId ?? item?.id,
        buyPriceAtSale: input.buyPriceAtSale ?? item?.buyPrice,
      };
      delete patch.saleId;
      delete patch.itemTitle;
      removeUndefinedValues(patch);
      const updated = await patchSale(input.saleId, patch);
      return formatSaleUpdated({ sale: updated, missing: missingSaleFields(updated) });
    }

    case 'tt_confirm_sale_log': {
      const confirmed = await confirmSale(input.saleId);
      return formatSaleConfirmed(confirmed);
    }

    case 'tt_tidy_inventory': {
      const r = await tidyInventory();
      const lines = ['✅ *Tidy complete.*'];
      if (r.backfill) {
        lines.push(
          `  • Backfilled *${r.backfill.updated}* items from Vinted (descriptions, categories, dates)` +
            (r.backfill.failed ? ` — ${r.backfill.failed} failed` : '') +
            (r.backfill.notFound ? `, ${r.backfill.notFound} gone from Vinted` : ''),
        );
      }
      if (r.enrich) {
        lines.push(
          `  • Enriched *${r.enrich.enriched}* items with AI vision` +
            (r.enrich.failed ? ` — ${r.enrich.failed} failed` : ''),
        );
      }
      if (r.sync) {
        const parts = [];
        if (r.sync.soldMarked) parts.push(`${r.sync.soldMarked} sold`);
        if (r.sync.viewsUpdated) parts.push(`${r.sync.viewsUpdated} views/likes updated`);
        lines.push(
          `  • Sync: ${parts.length ? parts.join(', ') : 'nothing new'}` +
            (r.sync.failed ? ` (${r.sync.failed} failed)` : ''),
        );
      }
      lines.push(`  _Took ${r.durationSec}s._`);
      if (r.error) lines.push(`⚠️ *Issues:* ${r.error}`);
      return lines.join('\n');
    }

    case 'tt_backfill_descriptions': {
      const r = await backfillFromVinted();
      return `Backfilled *${r.updated}* items from Vinted` +
        (r.failed ? ` — ${r.failed} failed` : '') +
        (r.notFound ? `, ${r.notFound} gone from Vinted` : '') +
        `. Considered ${r.considered}.`;
    }

    case 'tt_enrich_photos': {
      const r = await enrichWithGemini();
      return `Enriched *${r.enriched}* items with AI vision` +
        (r.failed ? ` — ${r.failed} failed` : '') +
        ` (${r.batches} batches).`;
    }

    case 'tt_vinted_sync': {
      const r = await syncWithVinted();
      const parts = [];
      if (r.soldMarked) parts.push(`*${r.soldMarked}* marked sold`);
      if (r.viewsUpdated) parts.push(`*${r.viewsUpdated}* views/likes updated`);
      return parts.length
        ? `Vinted sync: ${parts.join(', ')}.`
        : 'Vinted sync: nothing new.';
    }

    case 'tt_recall_images': {
      const limit = Math.min(input.limit ?? 10, 50);
      const rows = await searchChatImages({ q: input.query, since: input.since, limit });
      if (!rows.length) return 'No matching images in the archive.';
      return rows
        .map((r) => {
          const when = r.observedAt ? new Date(r.observedAt).toISOString().slice(0, 16).replace('T', ' ') : '?';
          const who = r.speakerName || 'unknown';
          const desc = (r.vlmDescription || '').replace(/\s+/g, ' ').slice(0, 240);
          const disc = r.discussion ? `\n    discussion: ${r.discussion.replace(/\s+/g, ' ').slice(0, 200)}` : '';
          return `• id=${r.id} ${when} [${who}] ${r.blobUrl}\n    ${desc}${disc}`;
        })
        .join('\n');
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

function marketQuery(analysis) {
  return [analysis.brand, analysis.category, analysis.era].filter(Boolean).join(' ');
}

function removeUndefinedValues(object) {
  Object.keys(object).forEach((key) => {
    if (object[key] === undefined) delete object[key];
  });
}

async function resolveSaleItem(input) {
  if (input.itemId) return null;
  if (!input.itemTitle) return null;
  const all = await getItems();
  const needle = input.itemTitle.toLowerCase();
  return all.find((i) => i.title?.toLowerCase().includes(needle)) ?? null;
}

function missingSaleFields(sale) {
  const missing = [];
  if (!sale.itemId) missing.push('which item sold');
  if (sale.salePrice == null) missing.push('sale price');
  if (!sale.soldAt) missing.push('sold date');
  if (sale.buyPriceAtSale == null) missing.push('buy price');
  return missing;
}
