/**
 * Vinted API client for the VPS bot.
 *
 * Uses the session cookie in VINTED_SESSION_COOKIE. The bot talks to Vinted
 * directly (rather than proxying through TT) because the session cookie
 * already lives on the VPS and refreshes there.
 *
 * All calls are rate-limited by jittered sleeps (800-1400ms) matched to the
 * original scraper behaviour — Vinted throttles aggressive clients.
 */

import { EventEmitter } from 'events';

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BASE = 'https://www.vinted.co.uk';

/**
 * Event bus for out-of-band Vinted signals. The scheduler subscribes at boot
 * and DMs James (rate-limited) when `session_expired` fires. Kept as an emitter
 * rather than a direct DM call so this module stays free of Baileys/DB imports.
 *
 * Events:
 *   - 'session_expired' — fired whenever a Vinted call returns 401/403
 */
export const vintedEvents = new EventEmitter();

function flagSessionExpired(where) {
  try {
    vintedEvents.emit('session_expired', { where, at: Date.now() });
  } catch {
    // never let listener errors break the request path
  }
  return new Error('VINTED_SESSION_EXPIRED');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(base = 800, spread = 600) {
  return base + Math.random() * spread;
}

function headers() {
  const cookie = process.env.VINTED_SESSION_COOKIE;
  if (!cookie) throw new Error('VINTED_SESSION_COOKIE not set');
  return {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': USER_AGENT,
    Cookie: cookie,
  };
}

/** Fetch a single item's full details (description, category tree, listedAt, etc) */
export async function fetchVintedItem(vintedId) {
  const r = await fetch(`${BASE}/api/v2/items/${vintedId}`, { headers: headers() });
  if (r.status === 404) return { notFound: true };
  if (r.status === 401 || r.status === 403) {
    throw flagSessionExpired(`fetchVintedItem:${vintedId}`);
  }
  if (!r.ok) throw new Error(`Vinted item ${vintedId} HTTP ${r.status}`);
  const body = await r.json();
  return body.item || body;
}

/** Fetch MG's entire wardrobe (for sync diffs). Returns array of items. */
export async function fetchWardrobe(userId) {
  const items = [];
  let page = 1;
  while (true) {
    const r = await fetch(
      `${BASE}/api/v2/wardrobe/${userId}/items?per_page=96&page=${page}&order=relevance`,
      { headers: headers() },
    );
    if (r.status === 401 || r.status === 403) throw flagSessionExpired('fetchWardrobe');
    if (!r.ok) throw new Error(`Vinted wardrobe HTTP ${r.status}`);
    const body = await r.json();
    const batch = body.items || [];
    // Belt-and-braces: only keep items that actually belong to this user.
    const mine = batch.filter((it) => String(it.user?.id) === String(userId));
    items.push(...mine);
    if (batch.length < 96) break;
    page++;
    await sleep(jitter());
  }
  return items;
}

export { sleep, jitter };
