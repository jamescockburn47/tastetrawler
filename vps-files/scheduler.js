/**
 * In-process scheduler for the bot. Uses node-cron (single process, same
 * timezone as the VPS). Jobs live in jobs.js; this file is pure wiring:
 *
 *   - 23:30 Europe/London — nightly tidy (end-to-end)
 *   - 07:30 Europe/London — morning briefing → group chat or first DM JID
 *   - Vinted session expiry — rate-limited DM to James
 *
 * Call `startScheduler(sock)` once after the WhatsApp socket is connected.
 * Pass the Baileys socket so jobs can send messages.
 */

import cron from 'node-cron';
import pino from 'pino';
import config from './config.js';
import { runNightlyTidy, buildMorningBriefing } from './jobs.js';
import { vintedEvents } from './vinted-api.js';
import { rateLimitOk, getFact, setFact } from './db.js';

const log = pino({ name: 'scheduler' });

const TZ = 'Europe/London';

// Resolve the target JID for scheduled messages. Priority:
//   1. First allowed group (MG + James + bot)
//   2. First allowed DM number (fallback for dev)
function briefingJid() {
  if (config.allowedGroups.length) return config.allowedGroups[0];
  if (config.allowedNumbers.length) return `${config.allowedNumbers[0]}@s.whatsapp.net`;
  return null;
}

// Resolve the alert JID for operational errors (expired Vinted session etc).
// Prefers DM to James — groups would be noisy and confuse MG.
function alertJid() {
  if (config.allowedNumbers.length) return `${config.allowedNumbers[0]}@s.whatsapp.net`;
  if (config.allowedGroups.length) return config.allowedGroups[0];
  return null;
}

export function startScheduler(sock) {
  // ─── Nightly tidy: 23:30 local ──────────────────────────────────────────
  cron.schedule(
    '30 23 * * *',
    async () => {
      log.info('nightly tidy triggered');
      const res = await runNightlyTidy();
      if (!res.ok) {
        const jid = alertJid();
        if (jid && rateLimitOk('alert:nightly_tidy_failed', 6 * 60 * 60 * 1000)) {
          try {
            await sock.sendMessage(jid, {
              text: `Nightly tidy failed: ${res.error}`,
            });
          } catch (e) {
            log.error({ err: e.message }, 'failed to send tidy failure DM');
          }
        }
      }
    },
    { timezone: TZ },
  );

  // ─── Morning briefing: 07:30 local ──────────────────────────────────────
  // Deduped: one per calendar day, keyed by YYYY-MM-DD in Europe/London.
  cron.schedule(
    '30 7 * * *',
    async () => {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
      const lastFact = getFact('briefing:last_sent_date');
      if (lastFact && lastFact.value === today) {
        log.info({ today }, 'briefing already sent today — skip');
        return;
      }
      const jid = briefingJid();
      if (!jid) {
        log.warn('no briefing JID configured — skipping morning briefing');
        return;
      }
      try {
        const text = await buildMorningBriefing();
        await sock.sendMessage(jid, { text });
        setFact('briefing:last_sent_date', today, 'scheduler');
        log.info({ jid, today }, 'morning briefing sent');
      } catch (e) {
        log.error({ err: e.message }, 'morning briefing failed');
      }
    },
    { timezone: TZ },
  );

  // ─── Vinted session expiry alert ────────────────────────────────────────
  // Rate-limited to one DM per hour so a failing cron doesn't spam.
  vintedEvents.on('session_expired', async ({ where }) => {
    if (!rateLimitOk('alert:vinted_session_expired', 60 * 60 * 1000)) return;
    const jid = alertJid();
    if (!jid) return;
    try {
      await sock.sendMessage(jid, {
        text: `Vinted session expired (from ${where}). Refresh VINTED_SESSION_COOKIE on the VPS.`,
      });
      log.info({ where }, 'vinted expiry DM sent');
    } catch (e) {
      log.error({ err: e.message }, 'failed to send vinted expiry DM');
    }
  });

  log.info({ tz: TZ }, 'scheduler started');
}
