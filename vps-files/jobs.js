/**
 * Scheduled job bodies for the bot. Pure functions — they don't know about
 * cron schedules; scheduler.js wires them to node-cron triggers.
 *
 * Each job returns a summary object that gets persisted to the `jobs` table
 * via db.recordJobRun(), plus (for user-visible jobs) a formatted text line
 * that scheduler.js sends to the right JID.
 */

import pino from 'pino';
import { tidyInventory } from './admin-tools.js';
import { getStats, getItems, getSales } from './tt-api.js';
import { auditSince, recordJobRun, getJobState } from './db.js';
import { buildMorningBriefingText } from './briefing-format.js';

const log = pino({ name: 'jobs' });
const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Nightly tidy (23:30) ───────────────────────────────────────────────────
// Runs the full tidy chain end-to-end. Results go to the jobs table. On
// failure, scheduler.js DMs James. No chat message sent on success — the
// morning briefing will show the aggregate effect.

export async function runNightlyTidy() {
  const started = Date.now();
  try {
    const result = await tidyInventory();
    recordJobRun('nightly_tidy', { ...result, startedAt: started });
    log.info({ result, durationMs: Date.now() - started }, 'nightly tidy ok');
    return { ok: true, result };
  } catch (err) {
    recordJobRun('nightly_tidy', null, err.message);
    log.error({ err: err.message }, 'nightly tidy failed');
    return { ok: false, error: err.message };
  }
}

// ─── Morning briefing (07:30) ───────────────────────────────────────────────
// Reads the last 24h of activity and returns a WhatsApp-formatted summary.
// Dedupe is enforced by scheduler.js via facts table (one per calendar day).

export async function buildMorningBriefing() {
  const now = Date.now();
  const since = now - DAY_MS;

  const [stats, listed, allItems, confirmedSales, pendingSales, draftSales, audit] = await Promise.all([
    getStats(1).catch((e) => ({ error: e.message })),
    getItems('listed').catch(() => []),
    getItems().catch(() => []),
    getSales('confirmed').catch(() => []),
    getSales('needs_review').catch(() => []),
    getSales('draft').catch(() => []),
    Promise.resolve(auditSince(since)),
  ]);

  const stale = listed.filter((i) => {
    if (!i.listedAt) return false;
    return (now - new Date(i.listedAt).getTime()) / DAY_MS >= 14;
  });

  const errors = audit.filter((a) => a.error);
  const recentSales = enrichRecentSales(confirmedSales, allItems, since);
  const missingBuyPrice = allItems.filter(
    (item) => item.status === 'sold' && item.soldPrice != null && item.buyPrice == null,
  );
  const reviewSales = [...pendingSales, ...draftSales];

  const text = buildMorningBriefingText({
    stats,
    recentSales,
    staleItems: stale,
    pendingSales: reviewSales,
    missingBuyPrice,
    auditErrors: errors,
    tidyLine: getLastJobState('nightly_tidy'),
  });

  recordJobRun('morning_briefing', { at: Date.now(), chars: text.length });
  return text;
}

function enrichRecentSales(sales, items, sinceTs) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  return sales
    .filter((sale) => sale.soldAt && new Date(sale.soldAt).getTime() >= sinceTs)
    .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
    .map((sale) => {
      const item = sale.itemId ? itemById.get(sale.itemId) : null;
      const buyPrice = sale.buyPriceAtSale ?? item?.buyPrice ?? null;
      const netProceeds = sale.netProceeds ?? sale.salePrice ?? null;
      return {
        ...sale,
        title: item?.title || sale.notes || 'Unmatched sale',
        buyPriceAtSale: buyPrice,
        profit: netProceeds != null && buyPrice != null ? netProceeds - buyPrice : null,
      };
    });
}

function getLastJobState(name) {
  const row = getJobState(name);
  if (!row || !row.last_run_at) return null;
  const ago = Math.round((Date.now() - row.last_run_at) / (60 * 1000));
  if (row.last_error) return `Last nightly tidy failed (${ago}m ago): ${row.last_error}`;
  try {
    const result = JSON.parse(row.last_result || '{}');
    const bits = [];
    if (result.backfill?.updated) bits.push(`${result.backfill.updated} backfilled`);
    if (result.enrich?.enriched) bits.push(`${result.enrich.enriched} enriched`);
    if (result.sync?.soldMarked) bits.push(`${result.sync.soldMarked} marked sold`);
    if (!bits.length) return null;
    return `Overnight tidy: ${bits.join(', ')}.`;
  } catch {
    return null;
  }
}
