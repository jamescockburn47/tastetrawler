#!/usr/bin/env node
/**
 * Taste Trawler — Vinted scraper
 * Scrapes all public listings for a Vinted user and imports them to TT.
 *
 * Usage:
 *   node vinted-scraper.js
 *
 * Env vars (set in .env or export):
 *   TT_API_URL            — e.g. https://tastetrawler.com
 *   VINTED_USERNAME       — e.g. mgmc80
 *   VINTED_EMAIL          — Vinted login email
 *   VINTED_PASSWORD       — Vinted login password
 *   VINTED_SESSION_COOKIE — (optional) raw cookie string from browser, bypasses login entirely
 *                           e.g. "_vinted_fr_session=xxx; access_token_web=yyy"
 *                           Get from Chrome DevTools → Application → Cookies → vinted.co.uk
 */

require('dotenv').config();
const { chromium } = require('playwright-extra');
const stealth      = require('puppeteer-extra-plugin-stealth');

chromium.use(stealth());

const TT_API_URL       = (process.env.TT_API_URL || 'https://tastetrawler.com').replace(/\/$/, '');
const VINTED_USERNAME  = process.env.VINTED_USERNAME  || 'mgmc80';
const VINTED_EMAIL     = process.env.VINTED_EMAIL     || '';
const VINTED_PASSWORD  = process.env.VINTED_PASSWORD  || '';
const SESSION_COOKIE   = process.env.VINTED_SESSION_COOKIE || '';

// Vinted condition codes → TT condition labels
const CONDITION_MAP = {
  1: 'New',       // New without tags
  6: 'New',       // New with tags
  2: 'Like New',  // Very good
  3: 'Good',      // Good
  4: 'Fair',      // Satisfactory
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function jitter(base = 1200) {
  return base + Math.random() * 600;
}

/** Get all vintedListingIds already in TT so we can skip duplicates */
async function getExistingIds() {
  try {
    const res = await fetch(`${TT_API_URL}/api/items`);
    if (!res.ok) return new Set();
    const items = await res.json();
    return new Set(items.filter(i => i.vintedListingId).map(i => i.vintedListingId));
  } catch {
    return new Set();
  }
}

/**
 * Direct API fetch using a raw cookie string.
 * Resolves user ID and paginates without a browser.
 */
async function resolveUserIdDirect(cookie) {
  const headers = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  };

  // Try user search endpoint
  for (const base of ['https://www.vinted.co.uk', 'https://www.vinted.fr', 'https://www.vinted.com']) {
    try {
      const r = await fetch(`${base}/api/v2/users/search?login=${encodeURIComponent(VINTED_USERNAME)}`, { headers });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.user?.id) {
        console.log(`  Found via ${base}`);
        return { userId: String(j.user.id), base };
      }
    } catch { /* try next */ }
  }
  return null;
}

async function fetchAllVintedItemsDirect(userId, base, cookie) {
  const allItems = [];
  let pageNum = 1;
  let totalExpected = null;
  const headers = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  };

  while (true) {
    const r = await fetch(`${base}/api/v2/users/${userId}/items?per_page=96&page=${pageNum}`, { headers });
    if (!r.ok) { console.error(`  API error page ${pageNum}: HTTP ${r.status}`); break; }
    const result = await r.json();
    const batch = result.items || [];
    if (totalExpected === null) {
      totalExpected = result.pagination?.total_count ?? result.total_count ?? batch.length;
    }
    allItems.push(...batch);
    console.log(`  Page ${pageNum}: got ${batch.length} items (${allItems.length}/${totalExpected})`);
    if (batch.length === 0 || allItems.length >= totalExpected) break;
    pageNum++;
    await sleep(jitter());
  }
  return allItems;
}

// ─── Browser path ─────────────────────────────────────────────────────────────

/** Log in to Vinted so we have an authenticated session */
async function loginWithBrowser(page) {
  console.log('  Trying to detect Vinted region...');

  // First visit the homepage to see what domain we're on
  await page.goto('https://www.vinted.co.uk/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  const currentUrl = page.url();
  const base = new URL(currentUrl).origin;
  console.log(`  Vinted base URL: ${base}`);

  // Dismiss cookie banner if present
  try {
    await page.click('[data-testid="onetrust-accept-btn-handler"]', { timeout: 3000 });
    await sleep(800);
  } catch { /* no banner */ }

  // Navigate to login
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  const title = await page.title();
  console.log(`  Login page title: "${title}"`);

  // Dump all inputs for debugging
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type, name: i.name, id: i.id,
      placeholder: i.placeholder, autocomplete: i.autocomplete,
    }))
  );
  console.log(`  Inputs found: ${JSON.stringify(inputs)}`);

  if (inputs.length === 0) {
    throw new Error('Login page loaded no inputs — likely still blocked by Cloudflare');
  }

  // Fill the first text/email input
  const emailSel = 'input[type="email"], input[name*="email"], input[name*="login"], input[name*="user"], input[type="text"]:first-of-type';
  await page.fill(emailSel, VINTED_EMAIL);
  await sleep(400);

  await page.fill('input[type="password"]', VINTED_PASSWORD);
  await sleep(400);

  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 });
  console.log(`  Logged in. URL: ${page.url()}\n`);
  await sleep(2000);

  return base;
}

/** Intercept Vinted API during page load to discover user ID */
async function resolveUserIdBrowser(page, base) {
  let userId = null;

  page.on('response', async (response) => {
    const url = response.url();
    const m = url.match(/\/api\/v2\/users\/(\d+)\/items/);
    if (m && !userId) userId = m[1];
  });

  await page.goto(`${base}/member/${VINTED_USERNAME}/items`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await sleep(3000);

  if (!userId) {
    userId = await page.evaluate(async (username) => {
      try {
        const r = await fetch(`/api/v2/users/search?login=${encodeURIComponent(username)}`, {
          headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        const j = await r.json();
        return j.user?.id ? String(j.user.id) : null;
      } catch { return null; }
    }, VINTED_USERNAME);
  }

  return userId;
}

/** Paginate through all items via browser context (inherits session cookies) */
async function fetchAllVintedItemsBrowser(page, userId) {
  const allItems = [];
  let pageNum   = 1;
  let totalExpected = null;

  while (true) {
    const result = await page.evaluate(async ({ userId, pageNum }) => {
      try {
        const r = await fetch(
          `/api/v2/users/${userId}/items?per_page=96&page=${pageNum}`,
          { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
        );
        return await r.json();
      } catch (e) {
        return { _error: e.message };
      }
    }, { userId, pageNum });

    if (result._error) {
      console.error(`  API error on page ${pageNum}:`, result._error);
      break;
    }

    const batch = result.items || [];
    if (totalExpected === null) {
      totalExpected = result.pagination?.total_count ?? result.total_count ?? batch.length;
    }

    allItems.push(...batch);
    console.log(`  Page ${pageNum}: got ${batch.length} items (${allItems.length}/${totalExpected})`);

    if (batch.length === 0 || allItems.length >= totalExpected) break;

    pageNum++;
    await sleep(jitter());
  }

  return allItems;
}

// ─── Payload ──────────────────────────────────────────────────────────────────

function buildPayload(vintedItem) {
  const photos = (vintedItem.photos || [])
    .map(p => p.full_size_url || p.url || p.thumb_url)
    .filter(Boolean);

  return {
    title:           vintedItem.title || '',
    description:     vintedItem.description || '',
    photos,
    listPrice:       vintedItem.price_numeric
                       ? Math.round(parseFloat(vintedItem.price_numeric) * 100)
                       : null,
    brand:           vintedItem.brand?.title    || null,
    category:        vintedItem.category?.title || null,
    condition:       CONDITION_MAP[vintedItem.status] || 'Good',
    size:            vintedItem.size_title       || null,
    status:          'listed',
    source:          'other',
    vintedListingId: String(vintedItem.id),
    listedAt:        vintedItem.created_at_ts
                       ? new Date(vintedItem.created_at_ts * 1000).toISOString()
                       : new Date().toISOString(),
    views:           vintedItem.view_count     || 0,
    likes:           vintedItem.favourite_count || 0,
  };
}

async function postItem(payload) {
  const res = await fetch(`${TT_API_URL}/api/items`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🐆 Taste Trawler — Vinted Scraper`);
  console.log(`   Username : @${VINTED_USERNAME}`);
  console.log(`   Target   : ${TT_API_URL}`);
  console.log(`   Mode     : ${SESSION_COOKIE ? 'cookie (direct API)' : 'browser (login)'}\n`);

  console.log('Checking existing TT inventory for duplicates...');
  const existingIds = await getExistingIds();
  console.log(`  ${existingIds.size} items already in TT\n`);

  let vintedItems = [];

  // ── Mode A: direct API with injected session cookie ──────────────────────
  if (SESSION_COOKIE) {
    console.log('Resolving user ID via direct API...');
    const found = await resolveUserIdDirect(SESSION_COOKIE);
    if (!found) throw new Error('Could not resolve user ID via direct API — check VINTED_SESSION_COOKIE');
    console.log(`  User ID: ${found.userId} (${found.base})\n`);

    console.log('Paginating through listings...');
    vintedItems = await fetchAllVintedItemsDirect(found.userId, found.base, SESSION_COOKIE);
    console.log(`\n  Total found: ${vintedItems.length}\n`);

  // ── Mode B: browser login ─────────────────────────────────────────────────
  } else {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'en-GB',
      extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
    });

    const page = await context.newPage();
    page.on('dialog', d => d.accept().catch(() => {}));

    try {
      if (!VINTED_EMAIL || !VINTED_PASSWORD) {
        throw new Error('No credentials — set VINTED_EMAIL + VINTED_PASSWORD or VINTED_SESSION_COOKIE');
      }

      console.log('Logging in to Vinted...');
      const base = await loginWithBrowser(page);

      console.log('Resolving Vinted user ID...');
      const userId = await resolveUserIdBrowser(page, base);
      if (!userId) throw new Error(`Could not determine user ID for @${VINTED_USERNAME}`);
      console.log(`  User ID: ${userId}\n`);

      console.log('Paginating through listings...');
      vintedItems = await fetchAllVintedItemsBrowser(page, userId);
      console.log(`\n  Total found: ${vintedItems.length}\n`);

    } finally {
      await browser.close();
    }
  }

  // ── Import ────────────────────────────────────────────────────────────────
  let imported = 0, skipped = 0, failed = 0;

  for (const vintedItem of vintedItems) {
    const vintedId = String(vintedItem.id);

    if (existingIds.has(vintedId)) {
      console.log(`  → skip  ${vintedItem.title?.slice(0, 55)}`);
      skipped++;
      continue;
    }

    const payload = buildPayload(vintedItem);

    try {
      await postItem(payload);
      console.log(`  ✓ ok    ${vintedItem.title?.slice(0, 55)}`);
      imported++;
    } catch (e) {
      console.error(`  ✗ fail  ${vintedItem.title?.slice(0, 55)}: ${e.message}`);
      failed++;
    }

    await sleep(300);
  }

  console.log(`\n✅ Done.`);
  console.log(`   Imported : ${imported}`);
  console.log(`   Skipped  : ${skipped} (already in TT)`);
  console.log(`   Failed   : ${failed}\n`);
}

main().catch(e => {
  console.error('\n❌ Fatal:', e.message);
  process.exit(1);
});
