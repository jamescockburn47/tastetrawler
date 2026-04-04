# Taste Trawler — Design Specification

**Date:** 2026-04-04
**Status:** Draft
**Author:** James Cockburn

## Overview

Taste Trawler is an AI-powered resale assistant for Vinted sellers. It learns the seller's aesthetic and selling patterns from their history, automates the operational grind (descriptions, pricing, tracking), and proactively surfaces sourcing opportunities matched to their taste profile.

The user is a part-time Vinted seller currently making ~£300/month profit from charity shop sourcing and Vinted flipping. The goal is to scale volume and margin by automating everything except the creative curation — which is the enjoyable part.

### Design Principles

1. **She curates, the system operates.** The hunt and the eye stay human. Research, descriptions, pricing, tracking, and sourcing discovery are automated.
2. **Learn her voice, not a generic one.** Descriptions, pricing instincts, and aesthetic preferences are learned from her specific history.
3. **Phone for capture and browsing, laptop for management.** Two modes, same app, responsive.
4. **Transparent AI.** Every suggestion shows its reasoning — why this price, why this item matched, what the comps are. No black boxes.
5. **Clean, typographic UI.** Monospace numbers, clear hierarchy, no decorative clutter. Dark mode. Geist typeface. The data speaks.

---

## 1. System Architecture

### Data Sources

**Vinted (Computer Use Agent)**
- No public API. Vinted actively blocks automated access via DataDome.
- Access method: headless browser automation (computer use) that mimics human browsing patterns.
- Data captured: sold history (photos, descriptions, sale prices, time-to-sell), active listing stats (views, likes, messages), category browsing for opportunity scanning.
- Session cookies stored encrypted in database. Agent runs server-side.
- Fragile by nature — designed to degrade gracefully when blocked. Manual fallback always available.

**eBay (Official Browse API)**
- Free, 5,000 calls/day. Legitimate, stable.
- Used for: comparable sold prices, monitoring charity shop eBay stores (BHF, Oxfam, Sue Ryder filtered by seller), general market research, sourcing opportunities.
- Completed/sold listing data requires scraping — eBay's official API only returns active listings. Use Apify or direct scraping for sold price comps.

**Charity Shop Online Stores**
- BHF, Oxfam, Sue Ryder operate eBay stores — accessible via eBay Browse API with seller filter.
- Oxfam's standalone site (Shopiago platform) requires scraping if we want broader coverage.
- Lower priority data source. Start with eBay store filtering only.

**Sale/Clearance Monitors**
- TK Maxx online clearance — scrapeable but sparse inventory. Low priority.
- Deprioritised for MVP. Architecture supports adding sources via a pluggable connector pattern.

### AI Core

**Vision Analysis: Gemini Flash**
- ~£0.02 per 100 images. Bulk image analysis for brand detection, era classification, colour palette extraction, condition assessment, style categorisation.
- Structured JSON output: brand, era, colours, style_tags, condition, story_potential_score.
- Free tier available for prototyping via Google AI Studio.

**Language Generation: Claude / Gemini (via user subscriptions)**
- Description generation, listing optimisation, opportunity reasoning.
- Learns seller's voice from existing listing history.
- Accessible via AI Gateway on Vercel for routing flexibility.

**Taste Engine (custom, built on top of vision + language models)**
- Detailed in Section 2 below.

### Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Next.js 16, shadcn/ui, Tailwind CSS, Geist font | Free |
| Hosting | Vercel (free tier) | Free |
| Database | Neon Postgres (free tier, 0.5GB) | Free |
| Photo Storage | Vercel Blob (free tier) | Free |
| Vision AI | Gemini Flash via AI Gateway | ~£5-10/month at scale |
| Language AI | Claude / Gemini via user subscriptions + AI Gateway | Covered by existing subs |
| eBay Data | Official Browse API | Free (5K calls/day) |
| Vinted Data | Computer use agent (headless browser) | Compute cost via Vercel Functions |
| Scheduling | Vercel Cron Jobs | Free tier |
| Auth | Clerk via Vercel Marketplace (free tier, 1 user) | Free |

**Estimated total running cost: £10-20/month** within the £40/month budget.

---

## 2. Taste Engine

The taste engine is the core differentiator. It doesn't pattern-match on brand + category — it learns three deeper signals from her selling history.

### Layer 1: Visual DNA

Every sold item is analysed by Gemini Flash vision to extract:
- **Colour palette** — dominant and accent colours, mapped to aesthetic clusters (earth tones, dark minimal, statement red, vintage gold, heritage green, etc.)
- **Texture and material** — leather, wool, silk, denim, ceramic, etc.
- **Silhouette and proportion** — oversized, structured, flowing, compact
- **Era markers** — decade-specific design cues (90s minimalism, 70s bohemian, Y2K, etc.)
- **Brand tier** — luxury, premium, high street, vintage/unknown

These attributes are stored as weighted vectors. Over time, the system builds a visual fingerprint of what she sells successfully — the intersection of what she's drawn to and what the market rewards.

The taste profile is browsable in the UI: colour clusters, top-performing aesthetics, strongest categories, and gaps (high-demand areas that match her style but she hasn't explored).

### Layer 2: Story Potential Scoring

Items don't sell on Vinted purely on specs. They sell on narrative. The AI learns to detect story potential:
- **Provenance cues** — visible labels, craftsmanship markers, era-specific construction details
- **Photogenic qualities** — items that photograph well, have interesting texture or colour
- **Nostalgia triggers** — era-specific items that resonate with current trends (cottagecore, Y2K revival, quiet luxury)
- **Rarity signals** — discontinued brands, limited editions, unusual colourways

Story potential is scored 1-10 and factored into opportunity ranking. A £10 charity shop find with high story potential (vintage Jaeger coat with silk lining) outranks a £10 find without it (generic high street top).

### Layer 3: Market Timing

Fashion resale has rhythms. The system tracks:
- **Seasonal demand curves** — historical Vinted/eBay search volume by category and month
- **Trend momentum** — rising search terms, correlated with broader fashion trends
- **Supply gaps** — categories with high demand but few good listings (opportunity zones)
- **Optimal listing times** — day of week and time of day that maximise visibility for her categories

This feeds into two outputs:
1. **Listing advice** — "Wool coats spike in 4 weeks. Hold pricing." / "List this now — Y2K accessories are peaking."
2. **Opportunity prioritisation** — seasonal items approaching their demand peak are ranked higher in the feed.

### Layer 4: Feedback Loop

Every interaction tightens the model:
- **Sale** → positive signal. Item attributes + speed + margin feed back into the taste profile.
- **Stale listing** → negative signal. What about this item didn't work? Price too high, wrong season, low story potential?
- **Opportunity swipe (yes/no)** → trains the scorer. She's implicitly labelling what matches her eye and what doesn't.
- **Description edits** → trains the voice model. Where she changes the AI's output teaches it her preferences.

The more she uses it, the sharper it gets. Her competitive advantage (her eye) becomes encoded and scalable.

---

## 3. Opportunity Feed ("The Trawl")

### Mobile View (Primary)

A card-based swipe interface showing AI-curated finds ranked by taste match and estimated margin.

Each card shows:
- Item photo from source listing
- Taste match percentage (how well it fits her visual DNA)
- Source and platform badge (eBay, Vinted, Oxfam eBay store, etc.)
- Asking price, estimated sell price, estimated margin
- Estimated time to sell based on comparable items
- AI reasoning: why this item was surfaced (1-2 sentences)

Actions per card:
- **Skip** — not interested. Negative signal to taste engine.
- **Save** — interested but not buying now. Bookmarked for later.
- **Want it** — she wants to pursue this. Link to source listing opens. Item added to "Pursuing" queue.

### Desktop View

Split-panel: scrollable list on left (ranked by match score + margin), detail panel on right with full photos, AI reasoning, comparable sales with links, and action buttons.

Filter tabs: All / Vinted / eBay / Charity / Saved.

### Feed Refresh

- Opportunity scanner runs on schedule (configurable, default twice daily).
- On-demand refresh available ("Trawl now" button).
- Morning notification concept: top 3 overnight finds pushed to the feed with a summary.

### Creative Features

- **Treasure Map** — when items are from charity shops with physical locations nearby, show a map view with pin counts.
- **Dead Stock Revival** — items listed 14+ days with no sale get AI-suggested relisting strategies (new description angle, repricing, different photos).
- **Margin Records** — personal bests tracked. Best single flip, best month, current streak.
- **Catch of the Day** — morning summary of overnight finds.

---

## 4. Listing Workbench

### Core Flow: Snap → AI Processes → Tweak → Approve

**Step 1: Photo Upload**
- Mobile: camera capture directly in the web app, or upload from gallery.
- Desktop: drag-and-drop upload.
- Multiple photos per item (front, back, label, detail, flaw close-ups).

**Step 2: AI Processing (seconds)**
- Gemini Flash vision analyses all photos.
- Extracts: brand, category, condition, colour, era, material, size (if visible).
- Generates: title, description (in her voice), category tags, suggested Vinted category.
- Pricing intelligence: pulls comparable sales from eBay + Vinted, calculates suggested price with confidence range.

**Step 3: Review and Edit**
- All AI-generated fields are editable.
- Tone controls: "more casual," "more detail," "shorter" — regenerates description with adjusted style.
- Buy price input (the only field she must enter manually) — triggers margin calculation.
- Photo coach: AI suggests additional shots if it detects gaps ("add a label shot — branded items get 3x views").

**Step 4: Approve**
- "Add to Inventory" — saves to database, listing is ready.
- Phase 1: "Copy to Clipboard" — formatted text for pasting into Vinted's listing form.
- Phase 2: "Publish to Vinted" — computer use agent fills the Vinted form and pauses for her final confirmation before submitting.

### Batch Mode

Upload multiple items at once. AI processes all in parallel. Review as a queue — swipe through approvals. Designed for post-charity-shop-run listing sessions.

### Voice Learning

The description generator starts generic but improves. It analyses her existing Vinted listings (harvested by the computer use agent) to learn:
- Vocabulary preferences ("gorgeous" vs "beautiful" vs "lovely")
- Emoji usage patterns
- Description structure (does she lead with brand? condition? story?)
- Typical length and tone

Over time, her edits to AI-generated descriptions further refine the model. The goal: descriptions she'd approve without changes 80%+ of the time.

---

## 5. Dashboard

### Overview Tab

Five KPI cards with period toggles (7d / 30d / 90d / YTD):
- **Revenue** — total sales value, % change vs prior period
- **Profit** — revenue minus buy costs, overall margin %
- **Items Sold** — count, average days to sell
- **Active Listings** — count, stale count (14+ days flagged)
- **Best Flip** — highest single margin this period, item name + margin %

### Inventory Tab

Table view of all items with columns: photo thumbnail, title, status (listed/sold/draft/stale), buy price, list price, days listed, views, likes. Sortable and filterable.

Stale items highlighted with AI-suggested actions:
- Relist with new angle (AI suggests alternative title/description framing based on trending terms)
- Reprice (AI suggests new price based on current comps and view-to-like ratio)
- Bundle suggestion (pair with another stale item for a bundle listing)

### Taste Profile Tab

Visual representation of her selling DNA:
- Colour palette clusters with % of sales
- Top-performing categories with margin data
- Era/style breakdown
- "Sweet spots" (high margin + fast sell categories)
- "Trending up" (categories with rising search volume that match her profile)
- "Stale patterns" (categories where her items consistently sit — consider dropping)
- "Untapped" (high-demand areas that match her aesthetic but she hasn't tried)

### Sources Tab

Performance by sourcing channel:
- Per-source: items purchased, items sold, avg margin, avg days to sell
- Tells her where to focus sourcing effort

---

## 6. Computer Use Agent Architecture

Three server-side agents running on Vercel Functions with Cron scheduling.

### Agent 1: Vinted Harvester

**Schedule:** Twice daily (configurable).
**Purpose:** Keep the database in sync with her Vinted account.

Process:
1. Launch headless browser with persisted Vinted session cookies (stored encrypted in Neon Postgres).
2. Navigate to her profile / sold items / active listings.
3. Extract: item photos, titles, descriptions, sale prices, listing dates, sold dates, view counts, like counts.
4. Diff against database — update changed items, insert new ones.
5. Flag newly stale items (14+ days, low engagement).
6. If session expired, flag for re-authentication (she re-logs in via the app, cookies are re-captured).

Anti-detection measures:
- Random delays between actions (2-8 seconds).
- Natural scroll patterns.
- Realistic viewport size and user agent.
- Session cookies persisted to avoid repeated logins.
- Low frequency (2x daily, not continuous).

### Agent 2: Opportunity Scanner

**Schedule:** Twice daily + on-demand.
**Purpose:** Find items matching her taste profile across all sources.

Process:
1. **eBay** (official API): Query Browse API with taste-profile-derived keywords. Filter by charity shop eBay sellers. Retrieve active listings with photos and prices.
2. **Vinted** (computer use): Browse configured categories. Filter by price range and keywords derived from taste profile.
3. **Score each item**: Send photos to Gemini Flash for visual analysis. Compare extracted attributes against her taste profile vectors. Calculate estimated sell price from eBay comps. Compute estimated margin and sell speed.
4. Rank by composite score: taste_match * 0.4 + estimated_margin * 0.3 + story_potential * 0.2 + market_timing * 0.1
5. Push top-scoring items to opportunity feed.

### Agent 3: Listing Publisher (Phase 2)

**Trigger:** User approves a listing and clicks "Publish to Vinted."
**Purpose:** Automate the Vinted listing form fill.

Process:
1. Launch headless browser with Vinted session.
2. Navigate to "Sell an item" form.
3. Upload photos from Vercel Blob storage.
4. Fill title, description, category, brand, condition, price from the approved listing data.
5. Pause — send notification to the user: "Listing ready for review on Vinted."
6. User opens Vinted, reviews the pre-filled form, and submits manually (Phase 2a) or confirms in Taste Trawler and the agent clicks submit (Phase 2b).

Phase 1 (MVP): no agent. Listing data is formatted and copied to clipboard. She pastes into Vinted manually. This works from day one with zero Vinted automation risk.

### Fallback Strategy

Vinted's computer use access is inherently fragile. The system must work without it:
- **If harvester is blocked**: manual import mode. She screenshots her Vinted sold page, AI extracts data from the screenshots via vision. Slower but functional.
- **If scanner is blocked on Vinted**: eBay-only scanning still works (official API). Vinted opportunities require manual browsing with the app as a research companion.
- **If publisher is blocked**: clipboard copy (Phase 1) is always available.

The architecture treats Vinted automation as an accelerator, not a dependency.

---

## 7. Deployment & Access

### Hosting

- **Vercel** — auto-deploy from GitHub on push. Free tier covers all compute needs at this scale.
- **URL**: `tastetrawler.vercel.app` or custom domain (e.g., `tastetrawler.co.uk`).
- **SSL**: automatic via Vercel.

### Device Access

- **Phone**: open URL in mobile browser. Add to home screen for app-like experience (PWA manifest with icon, splash screen, standalone display mode). Mobile views optimised for touch: swipe on opportunity feed, camera capture in listing workbench.
- **Laptop**: same URL, responsive layout expands to dashboard/workbench views with side panels and tables.
- No native app. No app store. No installation beyond bookmarking.

### Authentication

- Clerk via Vercel Marketplace (free tier, single user).
- Simple email/password or magic link login.
- Single-user system — no multi-tenancy complexity.

### Background Agents

- Vercel Cron Jobs trigger the harvester and scanner on schedule.
- Browser automation runs via an external headless browser service (Browserbase or similar) called from Vercel Serverless Functions. Vercel Functions have a max execution time of 800s with Fluid Compute — sufficient for focused scraping tasks, but the browser session itself is managed externally to avoid timeout issues on longer multi-page crawls.
- Alternative: Playwright running in a long-lived process on a cheap VPS (Hetzner, ~£4/month) if Browserbase costs are too high. The Vercel app calls the VPS API to trigger agent runs.
- Agents run independently of her device — results are waiting when she opens the app.

### Cost Summary

| Component | Monthly Cost |
|-----------|-------------|
| Vercel hosting (free tier) | £0 |
| Neon Postgres (free tier) | £0 |
| Vercel Blob (free tier) | £0 |
| Clerk auth (free tier) | £0 |
| eBay Browse API | £0 |
| Gemini Flash vision (est. 2,000 images/month) | £0.40 |
| Gemini Flash language (descriptions, scoring) | £2-5 |
| Claude / Gemini via existing subscriptions | £0 (covered) |
| Vercel Functions compute (agents) | £0-5 |
| **Total estimated** | **£5-15/month** |

Well within £40/month budget with substantial headroom for scaling.

---

## 8. Data Model (Key Entities)

**User** — single user, auth credentials, Vinted session data (encrypted).

**Item** — the core entity.
- id, photos (Blob URLs), title, description, brand, category, condition, era, colours, style_tags
- buy_price, list_price, sold_price, sold_date, listed_date
- source (charity_shop / vinted_flip / ebay / sale)
- status (draft / listed / sold / stale / archived)
- vinted_listing_id (if synced)
- taste_vector (JSON — output of vision analysis)
- story_potential_score (1-10)
- views, likes (synced from Vinted)

**TasteProfile** — aggregated from sold items.
- colour_clusters (JSON — weighted colour palette preferences)
- style_vectors (JSON — weighted aesthetic preferences)
- brand_affinities (JSON — brands that sell well for her)
- era_preferences (JSON — decade weightings)
- category_performance (JSON — margin and speed by category)
- updated_at (refreshed after each sale)

**Opportunity** — sourced items from the scanner.
- id, source_platform, source_url, source_price
- photos (URLs or cached), title, description
- taste_match_score, estimated_sell_price, estimated_margin, story_potential_score, market_timing_score
- composite_score
- status (new / saved / pursuing / skipped / purchased)
- ai_reasoning (text — why this was surfaced)

**ComparableSale** — price research data.
- platform, item_title, sold_price, sold_date, url
- linked to Item (for pricing intelligence)

**AgentRun** — audit log for computer use agents.
- agent_type (harvester / scanner / publisher)
- started_at, completed_at, status (success / partial / failed)
- items_processed, errors
- Used for monitoring agent health and debugging failures.

---

## 9. Phased Delivery

### Phase 1: Foundation (MVP)
- Next.js app with auth, deployed on Vercel
- Manual item entry: photo upload → AI processing → listing generation
- Pricing intelligence from eBay Browse API
- Inventory tracker with P&L dashboard
- Clipboard copy for Vinted listings
- Basic taste profile from manually entered items

### Phase 2: Vinted Integration
- Computer use harvester: sync sold history and active listing stats
- Full taste profile built from historical data
- Dead stock revival suggestions for stale items

### Phase 3: Opportunity Engine
- eBay opportunity scanner (official API)
- Vinted opportunity scanner (computer use)
- Charity shop eBay store monitoring
- Opportunity feed with swipe interface
- Taste match scoring and margin estimation

### Phase 4: Automation
- Listing publisher via computer use (Vinted form fill)
- Automated repricing suggestions with one-click apply
- Trend monitoring and seasonal timing advice
- Morning catch-of-the-day notifications

### Phase 5: Scale
- Additional source connectors (Depop, clearance sites)
- Bundle suggestion engine
- Multi-item photography workflow
- Performance analytics and sourcing ROI tracking
