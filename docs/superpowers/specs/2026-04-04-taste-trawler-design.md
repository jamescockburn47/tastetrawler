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
3. **WhatsApp for field work, web app for management.** WhatsApp is the primary capture interface (she's already in a charity shop with her phone). The web app handles dashboard, inventory, and batch operations.
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

## 6. WhatsApp Interface (Field Mode)

The WhatsApp interface is the primary capture and evaluation tool. MG already uses Clawd (the existing WhatsApp AI assistant) — Taste Trawler adds a set of resale-specific tools to the existing Clawd instance running on the VPS.

### Conversations

All Taste Trawler interactions happen in MG's existing WhatsApp DM with Clawd. The smart router classifies messages and routes to the appropriate Taste Trawler tool.

### Core WhatsApp Flows

**Photo Evaluation (in the charity shop)**
She sends a photo of an item. Clawd responds with:
- Brand identification (if detectable from labels/design)
- Category, era, condition assessment
- Taste match score (how well it fits her selling profile)
- Comparable sold prices from eBay/Vinted
- Estimated margin at various buy prices
- Recommendation: buy / pass / only if under £X

**Quick List**
She sends a photo + "list this" (or responds "list" after an evaluation). Clawd:
- Generates full listing (title, description in her voice, category, suggested price)
- Saves to Taste Trawler inventory as a draft
- Sends her a summary: "Saved: Coach saddle bag, suggested £62. Review in the app when you're ready."

**Opportunity Alerts**
Clawd proactively messages her when a high-scoring opportunity is found:
- "Found a Mulberry scarf on eBay BHF store for £8. Your taste match: 92%. Similar sold for £45-60. Link: [url]"
- Frequency capped (max 3 per day, configurable) to avoid notification fatigue.

**Quick Stats**
- "How am I doing?" → P&L snapshot for current period
- "What's stale?" → list of items needing attention with AI suggestions
- "What's trending?" → top opportunity feed highlights

### Integration with Clawd

Taste Trawler tools are added to Clawd's existing tool definitions (`tools/definitions.js`):

| Tool | Purpose |
|------|---------|
| `tt_evaluate_item` | Analyse photo(s), return taste match + pricing intelligence |
| `tt_quick_list` | Generate listing from photos, save to inventory |
| `tt_opportunity_alert` | Push high-scoring find to WhatsApp |
| `tt_stats` | Return P&L summary for period |
| `tt_stale_items` | List items needing attention |
| `tt_search_comps` | Search eBay/Vinted for comparable items |
| `tt_add_buy_price` | Record what she paid for an item |

These tools call the Taste Trawler API (Vercel app) for database operations and the eBay Browse API directly for price research. Vision analysis uses the existing Clawd image routing (EVO local vision first, cloud fallback).

### Access Control

MG already has limited Clawd access (calendar, todos, travel, web search). Taste Trawler tools are added to her allowed tool set. James retains full access to all tools plus admin/debug capabilities.

---

## 7. VPS Agent Architecture (Clawd-Derived)

The VPS agent is a fork of the existing Clawd system with browser automation capabilities added alongside WhatsApp. It retains Clawd's core machinery and adds Taste Trawler-specific tools and Playwright browser automation.

### What Transfers from Clawd

| Subsystem | Purpose in Taste Trawler |
|-----------|------------------------|
| Tool loop (claude.js) | Multi-step browser workflows with tool calling |
| Task planner | Dependency-aware execution for complex scraping sequences |
| Memory service | Learns effective search queries, browsing patterns, session state |
| Trace system | Logs every agent run for debugging when Vinted changes |
| HTTP server | API endpoint for Vercel app to trigger runs and receive results |
| Smart router | Routes WhatsApp messages to Taste Trawler tools vs regular Clawd tools |
| Image routing | EVO local vision (Qwen3-VL) for fast photo analysis, Claude fallback |
| Self-improvement | Evolution pipeline can optimise scraping strategies over time |

### What Gets Added

| Component | Purpose |
|-----------|---------|
| Playwright persistent contexts | Vinted session management (cookies stay warm between runs) |
| `tt_harvest_profile` tool | Scrape Vinted sold history and active listing stats |
| `tt_scan_vinted` tool | Browse Vinted categories for underpriced items |
| `tt_scan_ebay` tool | Query eBay Browse API for opportunities |
| `tt_scan_charity` tool | Monitor charity shop eBay stores |
| `tt_publish_listing` tool | Fill Vinted listing form via Playwright (Phase 2) |
| `tt_score_item` tool | Run taste engine scoring on a candidate item |
| Cron triggers | Schedule harvester and scanner runs |

### Three Agent Modes

**Harvester** — runs twice daily via cron. Uses Playwright persistent context to browse her Vinted profile. Extracts sold history, active listing stats (views, likes), syncs to Neon Postgres via the Vercel app API. Clawd's task planner handles the multi-page navigation with adaptive replanning if page structure changes.

**Opportunity Scanner** — runs twice daily + on-demand (triggered from WhatsApp or web app). eBay via official API (direct call, no browser needed). Vinted via Playwright. Charity shops via eBay seller filter. Each found item scored by the taste engine (Gemini Flash vision + profile comparison). High scorers pushed to the opportunity feed and optionally sent as WhatsApp alerts.

Scoring formula: `taste_match * 0.4 + estimated_margin * 0.3 + story_potential * 0.2 + market_timing * 0.1`

**Listing Publisher (Phase 2)** — triggered when she approves a listing. Playwright opens Vinted's "Sell an item" form, uploads photos, fills all fields, then pauses. She gets a WhatsApp message: "Listing ready for review on Vinted. Open and submit when happy." Phase 1 (MVP): clipboard copy, no browser automation.

### Anti-Detection

- Playwright persistent contexts keep Vinted session warm (no repeated logins)
- Random delays between actions (2-8 seconds) — Clawd's existing delay utilities
- Natural scroll patterns, realistic viewport and user agent
- Low frequency (2x daily, not continuous)
- If DataDome blocks: Clawd's trace system logs the failure, and the evolution pipeline can propose scraping strategy adjustments

### Fallback Strategy

Vinted automation is an accelerator, not a dependency:
- **Harvester blocked** → WhatsApp fallback: she screenshots her Vinted sold page, sends to Clawd, vision AI extracts the data
- **Scanner blocked on Vinted** → eBay-only scanning still works (official API). She browses Vinted manually with Clawd as a research companion via WhatsApp
- **Publisher blocked** → clipboard copy (Phase 1) always available

### VPS Infrastructure

The existing VPS already runs Clawd. Taste Trawler adds:
- Playwright installation + browser binary
- Persistent browser context storage directory
- Taste Trawler tool definitions added to Clawd's tool registry
- Cron entries for harvester and scanner schedules
- API endpoints for the Vercel web app to trigger runs and query results

---

## 8. Deployment & Access

### Two-System Architecture

```
┌─ Vercel (Web App) ──────────────────────┐
│  Next.js 16 + shadcn/ui                │
│  Dashboard, Listing Workbench, Feed     │
│  Neon Postgres (database)               │
│  Vercel Blob (photo storage)            │
│  Vercel Cron (triggers VPS agents)      │
│  Clerk (auth)                           │
│  AI Gateway (Gemini Flash routing)      │
└────────────── calls ───────────────────→┘
                  ↓
┌─ VPS (Clawd + Taste Trawler Agent) ────┐
│  Clawd (existing WhatsApp bot)          │
│  + Taste Trawler tools                  │
│  + Playwright (Vinted browser agent)    │
│  + eBay Browse API client               │
│  + EVO local vision (if on same VPS)    │
│  HTTP API for Vercel ↔ VPS comms        │
└─────────────────────────────────────────┘
```

### Access Points

- **WhatsApp** (primary field tool) — she messages Clawd directly. Already set up, already familiar. Taste Trawler tools route automatically via the smart router.
- **Web app** — `tastetrawler.vercel.app` or custom domain. Phone (add to home screen, PWA) for opportunity feed swiping. Laptop for dashboard, batch listing, inventory management.
- No additional apps to install. Two interfaces she already uses (WhatsApp + browser).

### Authentication

- **Web app**: Clerk via Vercel Marketplace (free tier, single user). Magic link login.
- **WhatsApp**: already authenticated — MG is a registered user in Clawd's access control.

### Background Agents

- VPS runs all browser automation (Playwright) and scheduled tasks.
- Vercel Cron triggers the VPS agent API on schedule (harvester 2x daily, scanner 2x daily).
- VPS reports results back to Vercel app via webhook.
- WhatsApp alerts sent directly from the VPS (Clawd's existing Baileys connection).
- Agents run independently of her device — results waiting in the web app and WhatsApp.

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
| VPS (existing, repurposed for browser agents) | £0 (already owned) |
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

## 10. Phased Delivery

### Phase 1: Foundation (MVP)
- Next.js web app with Clerk auth, deployed on Vercel
- Neon Postgres database + Vercel Blob photo storage
- Manual item entry: photo upload → AI processing (Gemini Flash) → listing generation
- Pricing intelligence from eBay Browse API
- Inventory tracker with P&L dashboard
- Clipboard copy for Vinted listings
- Basic taste profile from manually entered items
- **WhatsApp: `tt_evaluate_item` tool** — she sends a photo to Clawd, gets instant analysis and pricing. This is the day-one killer feature.
- **WhatsApp: `tt_quick_list` tool** — photo + "list this" saves a draft to the web app
- **WhatsApp: `tt_stats` tool** — quick P&L summary

### Phase 2: Vinted Integration
- Playwright installed on VPS with persistent browser contexts
- Vinted harvester agent: sync sold history and active listing stats
- Full taste profile built from historical data (visual DNA, voice learning)
- Dead stock revival suggestions for stale items
- **WhatsApp: `tt_stale_items` tool** — "what needs attention?"

### Phase 3: Opportunity Engine
- eBay opportunity scanner (official API)
- Vinted opportunity scanner (Playwright)
- Charity shop eBay store monitoring
- Opportunity feed with swipe interface in web app
- Taste match scoring and margin estimation
- **WhatsApp: opportunity alerts** — top finds pushed proactively (max 3/day)
- **WhatsApp: `tt_search_comps` tool** — "what are Coach bags selling for?"

### Phase 4: Automation
- Listing publisher via Playwright (Vinted form fill, Phase 2a: she submits, Phase 2b: agent submits)
- Automated repricing suggestions with one-click apply
- Trend monitoring and seasonal timing advice
- Morning catch-of-the-day WhatsApp summary

### Phase 5: Scale
- Additional source connectors (Depop, clearance sites)
- Bundle suggestion engine
- Batch photography workflow (web app)
- Performance analytics and sourcing ROI tracking
- Evolution pipeline: agent self-optimises scraping strategies based on trace analysis
