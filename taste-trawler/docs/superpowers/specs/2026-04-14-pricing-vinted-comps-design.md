# Pricing Accuracy + Vinted Comp Search — Design Spec

**Date:** 2026-04-14
**Status:** Draft
**Scope:** Fix systematic underpricing in listing suggestions; add Vinted as a comp source via Playwright scraping on VPS

## Context

MG flips charity-shop finds on Vinted (~£300/month). The Taste Trawler workbench generates listing suggestions with AI-estimated prices, but estimates are consistently low. Three structural causes:

1. eBay Browse API returns active listings sorted by `price` ascending — pulls the 10 cheapest, not a representative sample
2. Gemini prompt says "slightly below or at average comp price" — further undercuts
3. No Vinted comps at all — eBay pricing doesn't reflect the Vinted marketplace where she actually sells

**Goal:** Balanced pricing (market midpoint), multi-source comps (eBay + Vinted), confidence indicators so James/MG know when a price is well-supported vs guesswork.

---

## Workstream 1: Pricing Accuracy (Web App)

### 1A. CompResult Type Update

**File:** `lib/ebay/types.ts`

Widen the type to support multiple platforms:

```ts
export interface CompResult {
  platform: 'ebay' | 'vinted';
  title: string;
  price: number;          // pence
  url: string;
  imageUrl: string;
  condition: string;
  seller: string;
  isSold: boolean;        // NEW — true for sold items, false for active listings
}
```

Backward compatible — existing code ignores unknown fields. Bot tools that destructure `{ title, price, url }` continue working.

### 1B. eBay Search Improvements

**File:** `lib/ebay/client.ts`

**Fix 1 — Remove price sort (line 96):**
Delete `sort: 'price'` from the URLSearchParams. eBay defaults to "Best Match" which returns a representative cross-section of listings.

**Fix 2 — Add `isSold: false` to all eBay results:**
eBay Browse API only returns active listings (not sold), so all results get `isSold: false`.

**Fix 3 — Smarter query builder:**

New exported function:

```ts
export function buildCompQuery(analysis: {
  brand?: string | null;
  category?: string | null;
  era?: string | null;
  material?: string | null;
  size?: string | null;
  condition?: string | null;
}): string {
  return [
    analysis.brand,
    analysis.material,
    analysis.category,
    analysis.size,
    analysis.era,
    analysis.condition,
  ].filter(Boolean).join(' ');
}
```

This produces queries like `"Mulberry leather crossbody bag medium vintage good"` instead of `"Mulberry Bags vintage"`.

### 1C. Pricing Prompt Rewrite

**File:** `lib/ai/generate-listing.ts`

**Updated GeneratedListing interface:**

```ts
export interface GeneratedListing {
  title: string;
  description: string;
  suggestedPrice: number;   // pence — market midpoint (recommended)
  priceLow: number;         // pence — quick sale floor
  priceHigh: number;        // pence — patient seller ceiling
  priceConfidence: 'high' | 'medium' | 'low';
  priceReasoning: string;
  category: string;
}
```

**Updated prompt (key changes):**
- Remove "slightly below or at average" — replace with "recommend the market midpoint"
- Ask for three prices: quick sale, recommended, patient
- Comp summary separates eBay active listings from Vinted sold items
- Instruct model: "Weight sold prices more heavily than active listing prices — sold prices reflect what buyers actually paid"
- Confidence rating: high = 5+ comps with price spread < 40% of median; medium = 2-4 comps; low = 0-1 comps or spread > 40%

### 1D. Pricing Panel UI Update

**File:** `components/pricing-panel.tsx`

**Three-column price range:**
- Quick Sale | Recommended | Patient
- Recommended gets emphasis (larger font, green)

**Confidence indicator:**
- Green dot + "High confidence" / Amber dot + "Medium" / Red dot + "Low"
- Shown next to the price reasoning

**Comp list improvements:**
- Platform badge: teal "V" for Vinted, blue "eB" for eBay
- SOLD label on sold comps
- Sorted: sold comps first (more reliable signal), then active

### 1E. Comps API Route Update

**File:** `app/api/comps/route.ts`

Accept optional `sources` param:

```ts
POST /api/comps
Body: { query: string, sources?: ('ebay' | 'vinted')[], limit?: number }
```

Fan-out logic:
- eBay: existing `searchEbay()` call
- Vinted: query `comparable_sales` table for rows with `platform = 'vinted'` matching the query, created within last 24h
- `Promise.allSettled` — one source failing doesn't block the other
- Merge results, tag each with platform
- Return `{ results: CompResult[], errors?: { source: string, message: string }[] }`

### 1F. Vinted Comp Cache Endpoint

**File:** `app/api/vinted-comps/route.ts` (new)

```ts
POST /api/vinted-comps
Auth: Bearer TT_API_KEY
Body: { query: string, results: CompResult[] }
```

- Validates bearer token (existing `lib/api-auth.ts`)
- Inserts each comp into `comparable_sales` table
- Returns `{ cached: number }`

**Schema migration required:** Add `searchQuery` column to `comparable_sales` table (text, nullable). This allows lookup of cached Vinted comps by the query string that produced them (e.g. `WHERE platform = 'vinted' AND search_query = ? AND created_at > now() - interval '24 hours'`). Existing rows get NULL which is fine — they're all eBay comps tied to specific items via `itemId`.

```sql
ALTER TABLE comparable_sales ADD COLUMN search_query text;
```

Add to Drizzle schema: `searchQuery: text('search_query')` in `comparableSales` table.

---

## Workstream 2: Vinted Comp Search (VPS)

### 2A. Playwright Scraper

**File:** `/opt/taste-trawler-agent/vinted-comp-scraper.js` (new)

**Approach:**
1. Launch headless Chromium with stealth plugin
2. Set Vinted session cookie from `VINTED_SESSION_COOKIE` env var
3. Navigate to Vinted search URL: `https://www.vinted.co.uk/catalog?search_text={query}`
4. Primary extraction: intercept XHR to `/api/v2/catalog/items` — structured JSON with price, status, condition
5. Fallback: DOM scraping of search result cards if XHR interception fails
6. Extract per item: title, price (convert to pence), isSold, condition, imageUrl, listingUrl
7. Browser cleanup in `finally` block — no leaked processes

**Dependencies:**
- `playwright` (already on VPS from existing code, just needs Chromium browser)
- `playwright-extra` + `puppeteer-extra-plugin-stealth` for anti-bot evasion

**Export:**

```js
async function searchVinted(query, { limit = 10 } = {}) → CompResult[]
```

CLI-testable: `node vinted-comp-scraper.js "mulberry bag"` prints results.

### 2B. Bot Tool: tt_vinted_comps

**File:** `/opt/taste-trawler-agent/tools.js`

**Tool definition:**

```js
{
  name: 'tt_vinted_comps',
  description: 'Search Vinted for comparable items. Returns active and sold listings with prices.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query, e.g. "Mulberry Bayswater bag"' },
      limit: { type: 'number', description: 'Max results (default 10)' }
    },
    required: ['query']
  }
}
```

**Handler:**
1. Call `searchVinted(query, { limit })`
2. Fire-and-forget POST to `TT_API_URL/api/vinted-comps` with results (cache for workbench)
3. Format WhatsApp-friendly output: item list with prices, sold markers

**Integration into existing tools:**
- `tt_evaluate_item`: fan out to eBay + Vinted via `Promise.allSettled`, merge comps for pricing
- `tt_quick_list`: same fan-out, pass merged comps to generate-listing

### 2C. Playwright Installation

```bash
cd /opt/taste-trawler-agent
npm install playwright playwright-extra puppeteer-extra-plugin-stealth
npx playwright install chromium
npx playwright install-deps chromium
```

### 2D. Deployment

1. SCP new/modified files to VPS
2. `systemctl restart taste-trawler`
3. Test with `tt_vinted_comps "mulberry bag"` via WhatsApp

---

## Verification Plan

1. **eBay sort fix:** Run `/api/comps` with a known brand — confirm prices are no longer sorted ascending, and spread is wider than before
2. **Query builder:** Compare old query ("Mulberry Bags") vs new ("Mulberry leather crossbody bag good") — new should return more relevant comps
3. **Pricing prompt:** Generate listing for a test item — confirm three prices returned (low/mid/high), no "slightly below" language in reasoning
4. **Pricing panel:** Visual check in workbench — three-column layout, confidence dot, platform badges
5. **Vinted scraper:** SSH to VPS, run `node vinted-comp-scraper.js "zara dress"` — confirm structured results
6. **Bot tool:** Send WhatsApp message "what are mulberry bags going for on vinted" — confirm formatted comp list
7. **Cache flow:** After bot scrape, check `/api/comps` with `sources: ['vinted']` — confirm cached results returned
8. **End-to-end:** Upload photo in workbench, confirm pricing panel shows both eBay and Vinted comps with appropriate labels

---

## Files Modified

| File | Change |
|---|---|
| `taste-trawler/lib/ebay/types.ts` | Widen CompResult: platform union, isSold field |
| `taste-trawler/lib/ebay/client.ts` | Remove price sort, add buildCompQuery, isSold on results |
| `taste-trawler/lib/ai/generate-listing.ts` | Prompt rewrite, GeneratedListing interface (price range + confidence) |
| `taste-trawler/app/api/comps/route.ts` | Multi-source fan-out (eBay + Vinted cache) |
| `taste-trawler/app/api/vinted-comps/route.ts` | New — receives bot-pushed Vinted comps |
| `taste-trawler/components/pricing-panel.tsx` | Three-column prices, confidence, platform badges |
| `taste-trawler/app/workbench/page.tsx` | Use buildCompQuery, pass new pricing fields |
| VPS: `vinted-comp-scraper.js` | New — Playwright Vinted search |
| VPS: `tools.js` | New tt_vinted_comps tool + integrate into evaluate/quick-list |
| VPS: `tt-api.js` | New pushVintedComps method |
