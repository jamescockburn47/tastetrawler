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
import { getStats, getItems } from './tt-api.js';
import { auditSince, recordJobRun, getJobState } from './db.js';

const log = pino({ name: 'jobs' });

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
  const dayMs = 24 * 60 * 60 * 1000;
  const since = Date.now() - dayMs;

  const [stats, listed, audit] = await Promise.all([
    getStats(1).catch((e) => ({ error: e.message })),
    getItems('listed').catch(() => []),
    Promise.resolve(auditSince(since)),
  ]);

  const stale = listed.filter((i) => {
    if (!i.listedAt) return false;
    return (Date.now() - new Date(i.listedAt).getTime()) / dayMs >= 14;
  });

  const errors = audit.filter((a) => a.error);

  const lines = ['*Morning briefing.*'];
  if (stats && !stats.error) {
    const parts = [];
    if (typeof stats.sold === 'number') parts.push(`${stats.sold} sold`);
    if (typeof stats.revenue === 'number')
      parts.push(`£${(stats.revenue / 100).toFixed(2)} revenue`);
    if (typeof stats.profit === 'number')
      parts.push(`£${(stats.profit / 100).toFixed(2)} profit`);
    lines.push(`Last 24h: ${parts.length ? parts.join(', ') : 'nothing logged'}.`);
  } else if (stats?.error) {
    lines.push(`Last 24h: stats unavailable (${stats.error}).`);
  }

  lines.push(
    `${listed.length} live listings${stale.length ? `, ${stale.length} stale (14d+)` : ''}.`,
  );

  // Last nightly tidy result, if we ran it
  const tidyState = getLastJobState('nightly_tidy');
  if (tidyState) lines.push(tidyState);

  if (errors.length) {
    lines.push(`${errors.length} tool errors overnight — check audit log.`);
  }

  const text = lines.join('\n');
  recordJobRun('morning_briefing', { at: Date.now(), chars: text.length });
  return text;
}

function getLastJobState(name) {
  const row = getJobState(name);
  if (!row || !row.last_run_at) return null;
  const ago = Math.round((Date.now() - row.last_run_at) / (60 * 1000));
  if (row.last_error) return `Last nightly tidy failed (${ago}m ago): ${row.last_error}`;
  try {
    const r = JSON.parse(row.last_result || '{}');
    const bits = [];
    if (r.backfill?.updated) bits.push(`${r.backfill.updated} backfilled`);
    if (r.enrich?.enriched) bits.push(`${r.enrich.enriched} enriched`);
    if (r.sync?.soldMarked) bits.push(`${r.sync.soldMarked} marked sold`);
    if (!bits.length) return null;
    return `Overnight tidy: ${bits.join(', ')}.`;
  } catch {
    return null;
  }
}
