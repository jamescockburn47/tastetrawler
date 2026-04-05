/**
 * Admin tools for the bot — bulk operations on MG's TT inventory.
 *
 * These are fire-and-forget: MG says "tidy", the bot runs the whole chain
 * and reports one summary line. No progress messages, no clarifying questions.
 *
 * Building blocks:
 *   1. backfillFromVinted()  — populate description/category/listedAt/size from Vinted
 *   2. enrichWithGemini()    — loop /api/admin/enrich until drained
 *   3. syncWithVinted()      — diff wardrobe against DB, mark sold, update views/likes
 *
 * Unified: tidyInventory() runs all three and returns a formatted summary.
 */

import { getItems, patchItem, enrichBatch } from './tt-api.js';
import { fetchVintedItem, fetchWardrobe, sleep, jitter } from './vinted-api.js';

const VINTED_USER_ID = parseInt(process.env.VINTED_USER_ID || '119518667', 10);

// Vinted status code → TT condition label
const CONDITION_MAP = {
  1: 'New',
  6: 'New',
  2: 'Like New',
  3: 'Good',
  4: 'Fair',
};

// ─── Block 1: backfill description/category/listedAt from Vinted ─────────────

async function backfillFromVinted() {
  const all = await getItems();
  const needs = all.filter(
    (i) => i.vintedListingId && (!i.description || !i.category || !i.listedAt),
  );

  let updated = 0;
  let failed = 0;
  let notFound = 0;

  for (const item of needs) {
    try {
      const v = await fetchVintedItem(item.vintedListingId);
      if (v.notFound) {
        notFound++;
        continue;
      }

      const patch = {};
      if (!item.description && v.description) patch.description = v.description;
      if (!item.category && v.category_title) patch.category = v.category_title;
      if (!item.brand && v.brand_dto?.title) patch.brand = v.brand_dto.title;
      if (!item.size && v.size_title) patch.size = v.size_title;
      if (!item.condition && v.status != null) {
        patch.condition = CONDITION_MAP[v.status] || null;
      }
      if (!item.listedAt && v.created_at_ts) {
        // Vinted's created_at_ts is seconds-since-epoch for the original listing.
        // Good enough as an approximation of "when MG put this on Vinted".
        patch.listedAt = new Date(v.created_at_ts * 1000).toISOString();
      }

      if (Object.keys(patch).length > 0) {
        await patchItem(item.id, patch);
        updated++;
      }
    } catch (e) {
      if (e.message === 'VINTED_SESSION_EXPIRED') throw e;
      failed++;
    }
    await sleep(jitter());
  }

  return { updated, failed, notFound, considered: needs.length };
}

// ─── Block 2: Gemini enrichment via TT admin endpoint ────────────────────────

async function enrichWithGemini() {
  let enriched = 0;
  let failed = 0;
  let batches = 0;
  let lastRemaining = Infinity;

  // Drain loop: keep calling until TT reports remaining === 0.
  // Hard cap at 500 batches (≈10k items) as a runaway guard.
  // Also break if remaining stops decreasing (stuck on un-enrichable items).
  while (batches < 500) {
    const res = await enrichBatch(20);
    enriched += res.enriched;
    failed += res.failed;
    batches++;
    if (res.processed === 0 || res.remaining === 0) break;
    if (res.remaining >= lastRemaining) break;
    lastRemaining = res.remaining;
  }

  return { enriched, failed, batches, remaining: lastRemaining === Infinity ? 0 : lastRemaining };
}

// ─── Block 3: sync wardrobe state back to TT ────────────────────────────────

async function syncWithVinted() {
  const [wardrobe, ttItems] = await Promise.all([
    fetchWardrobe(VINTED_USER_ID),
    getItems(),
  ]);

  const wardrobeById = new Map(wardrobe.map((w) => [String(w.id), w]));
  const tracked = ttItems.filter((i) => i.vintedListingId);

  let soldMarked = 0;
  let viewsUpdated = 0;
  let failed = 0;

  for (const item of tracked) {
    try {
      const v = wardrobeById.get(item.vintedListingId);
      if (!v && item.status === 'listed') {
        // Gone from wardrobe while we thought it was listed → likely sold
        await patchItem(item.id, {
          status: 'sold',
          soldAt: new Date().toISOString(),
        });
        soldMarked++;
        continue;
      }
      if (v) {
        const patch = {};
        if (typeof v.view_count === 'number' && v.view_count !== item.views) {
          patch.views = v.view_count;
        }
        if (typeof v.favourite_count === 'number' && v.favourite_count !== item.likes) {
          patch.likes = v.favourite_count;
        }
        if (Object.keys(patch).length > 0) {
          await patchItem(item.id, patch);
          viewsUpdated++;
        }
      }
    } catch {
      failed++;
    }
  }

  return { soldMarked, viewsUpdated, failed, tracked: tracked.length };
}

// ─── Unified orchestrator ─────────────────────────────────────────────────────

export async function tidyInventory() {
  const startedAt = Date.now();
  const result = {
    backfill: null,
    enrich: null,
    sync: null,
    error: null,
    durationSec: 0,
  };

  try {
    result.backfill = await backfillFromVinted();
  } catch (e) {
    result.error = `Backfill: ${e.message}`;
    if (e.message === 'VINTED_SESSION_EXPIRED') {
      result.durationSec = Math.round((Date.now() - startedAt) / 1000);
      return result;
    }
  }

  try {
    result.enrich = await enrichWithGemini();
  } catch (e) {
    result.error = (result.error ? result.error + '; ' : '') + `Enrich: ${e.message}`;
  }

  try {
    result.sync = await syncWithVinted();
  } catch (e) {
    result.error = (result.error ? result.error + '; ' : '') + `Sync: ${e.message}`;
  }

  result.durationSec = Math.round((Date.now() - startedAt) / 1000);
  return result;
}

// Also export the individual pieces so targeted tools can call them.
export { backfillFromVinted, enrichWithGemini, syncWithVinted };
