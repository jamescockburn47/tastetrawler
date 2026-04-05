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

export async function createItem(data) {
  return ttFetch('/api/items', { method: 'POST', body: JSON.stringify(data) });
}

export async function getStats(days = 30) {
  return ttFetch(`/api/stats?days=${days}`);
}

export async function getItems(status) {
  return ttFetch(`/api/items${status ? `?status=${status}` : ''}`);
}

export async function patchItem(id, data) {
  return ttFetch(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
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
