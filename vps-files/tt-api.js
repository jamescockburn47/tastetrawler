import config from './config.js';

async function ttFetch(path, options = {}) {
  const res = await fetch(`${config.ttApiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.ttApiKey}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`TT API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function analysePhotos(photoUrls) {
  return ttFetch('/api/analyse', { method: 'POST', body: JSON.stringify({ photoUrls }) });
}

export async function searchComps(query) {
  return ttFetch('/api/comps', { method: 'POST', body: JSON.stringify({ query }) });
}

export async function generateListing(analysis, comps) {
  return ttFetch('/api/generate-listing', { method: 'POST', body: JSON.stringify({ analysis, comps }) });
}

export async function buildValuation(analysis, comps, buyPrice = null) {
  return ttFetch('/api/valuation', { method: 'POST', body: JSON.stringify({ analysis, comps, buyPrice }) });
}

export async function createItem(data) {
  return ttFetch('/api/items', { method: 'POST', body: JSON.stringify(data) });
}

export async function getStats(days = 30) {
  return ttFetch(`/api/stats?days=${days}`);
}

export async function getItems(status) {
  return ttFetch(`/api/items${status ? `?status=${status}` : ''}`);
}

export async function getSales(status) {
  return ttFetch(`/api/sales${status ? `?status=${status}` : ''}`);
}

export async function patchItem(id, data) {
  return ttFetch(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function createSale(data) {
  return ttFetch('/api/sales', { method: 'POST', body: JSON.stringify(data) });
}

export async function patchSale(id, data) {
  return ttFetch(`/api/sales/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function confirmSale(id, data = {}) {
  return ttFetch(`/api/sales/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) });
}

/** Trigger a single batch of Gemini enrichment. Returns { enriched, failed, remaining, processed }. */
export async function enrichBatch(limit = 20) {
  return ttFetch('/api/admin/enrich', { method: 'POST', body: JSON.stringify({ limit }) });
}

/**
 * Aggregate taste profile — top brands/colours/categories/tags over sold items.
 * Injected into the bot's system prompt so it can reason about what actually sells
 * instead of guessing. Safe to call on boot and on a cadence; if the web app is
 * down we degrade to an empty profile rather than crashing the bot.
 */
export async function getTasteProfile() {
  return ttFetch('/api/taste-profile');
}

// ─── Chat-image capture / recall ────────────────────────────────────────────
// The bot captures every photo it sees (trigger or no trigger) and hands the
// bytes off to the web app, which stores them in Vercel Blob and indexes a row
// in `chat_images`. The row later backs both the website gallery and the
// `tt_recall_images` tool.

/**
 * Create a chat-image row. `imageBase64` is raw base64 (no data: prefix).
 * Returns the created row, including `id` and `blobUrl`.
 */
export async function createChatImage(payload) {
  return ttFetch('/api/chat-images', { method: 'POST', body: JSON.stringify(payload) });
}

/**
 * Append to the discussion field on an existing chat image. Called each time
 * the bot answers a question that touches a stored photo, so MG ends up with
 * a per-image log of what was said.
 */
export async function appendChatImageDiscussion(id, append, extras = {}) {
  return ttFetch(`/api/chat-images/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ append, ...extras }),
  });
}

/**
 * Search the chat-images index. Supports free text (q), since (ms epoch or ISO),
 * jid scope, and limit. Returns an array of rows ordered by most recent first.
 */
export async function searchChatImages({ q, since, jid, limit = 20 } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (since) qs.set('since', String(since));
  if (jid) qs.set('jid', jid);
  qs.set('limit', String(limit));
  return ttFetch(`/api/chat-images?${qs.toString()}`);
}
