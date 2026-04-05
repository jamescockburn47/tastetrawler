# Taste Trawler — UI Redesign: Malibu × Leopard

**Date:** 2026-04-05
**Status:** Design approved, ready for implementation plan
**Author:** James (with Claude Opus 4.6)

---

## 1. Problem

The current Taste Trawler web app is shadcn-default monochrome. MG's reaction to it is *"cheap, unpolished"* and it is actively putting her off adopting the product. Since MG is the entire user base — and her buy-in is the project's success criterion — this is a P0 product problem, not a polish task.

MG's taste is barbiecore + leopard-print maximalism fused with modern luxury. She wants bubble fonts and glitter, but combined with taste and clarity. The brief is therefore *not* restrained editorial (Valentino Pink PP minimal) and *not* Canva Y2K bubblegum — it is **Blumarine SS22 / Moschino Jeremy Scott / Juicy Couture at runway craft**: maximalist expression executed with discipline tighter than minimalism demands.

The web app's role in MG's life sits between *occasional browse* and *daily tool*. The bot on WhatsApp remains her primary interface. The web app is where she scrolls stock photos, reviews P&L, celebrates sales, and — crucially, as the hero feature of this redesign — **tells the bot to restyle the interface** ("make it pinker", "less leopard", "bigger headlines") and watches it change.

## 2. Goals / non-goals

### Goals

1. Eliminate the "cheap / unpolished" smell across every surface MG touches.
2. Deliver two fully realised themes (Malibu = barbiecore + luxury, Leopard = animal print + luxury), switchable like light/dark mode.
3. Ship a bot-driven theme-editing feature (`tt_adjust_theme`) that lets MG mutate the interface via WhatsApp using natural language.
4. Keep the existing operational surfaces (tables, forms, KPIs) legible and fast under both themes.
5. Preserve all current functionality — no API-route churn, no schema breakage, no bot-tool regressions.

### Non-goals

- Restructuring API routes beyond the new `/api/theme/*` endpoints.
- Changing the Drizzle schema beyond two new tables (`theme_settings`, `theme_history`).
- Touching existing bot tools — only additions.
- Per-user themes. MG and James share dials in phase 1.
- Storybook, design-system extraction, visual regression testing.
- Arbitrary bot-driven code generation. The bot turns a fixed set of dials; it never rewrites JSX or free-form CSS.

## 3. Guiding principle

> **One loud element per surface, everything else rigorously disciplined.**

Maximalism done well is *more* disciplined than minimalism, not less. Blumarine's stitching tolerances are tighter than Jil Sander's. Sloppy maximalism looks catastrophic. Every theatrical element must sit on a rigorously crafted foundation — locked type scale, 4px spacing grid, 60fps micro-interactions, perfect alignment, proper loading/empty/error states. The glitter sits on top of that foundation, never instead of it.

## 4. Surface inventory

### 4.1 Theatre surfaces (full expression: display font, motif, hero imagery, micro-animations)

1. **Landing / sign-in** (`/`, `/sign-in`, `/sign-up`) — first impression, hero surface.
2. **Inventory gallery** — *new route* `/inventory/gallery` — editorial photo grid. Same data as the existing table, different presentation.
3. **Empty states** across every page — themed illustrations + copy in MG's voice.
4. **Sale celebration** — full-bleed celebration animation when an item sells.

### 4.2 Work surfaces (Geist Sans/Mono, themed colours only, no display font)

1. **Dashboard** (`/dashboard`) — KPIs, P&L, stale items.
2. **Inventory table** (`/inventory`) — 127 rows, sortable, dense.
3. **Workbench / listing editor** (`/workbench`) — forms, photo upload, pricing panel.
4. Auth and settings pages beyond the sign-in hero.

### 4.3 Bridge surfaces (themed chrome, work content)

1. **Top nav** — display-font wordmark, motif underline on active link, Geist for link labels.
2. **Cards** on dashboard — themed borders/radii/shadows, Geist content inside.
3. **Theme switcher** — always visible in nav, two-state glyph (sparkle / spot).

## 5. The two themes

Both themes share: layout grid, component shapes, type scale, Geist Sans (body) + Geist Mono (data). Only the chrome layer differs.

### 5.1 Theme 1 — **Malibu** (barbiecore + luxury)

**Reference gestalt:** Blumarine SS22 (Nicola Brognano era), Valentino Pink PP campaign, Juicy Couture Y2K revival.

| Token | Direction |
|---|---|
| Background | Warm off-white (`oklch ~0.98 0.01 20`) — never pure white, warm pink undertone |
| Surface/card | White with barely-there pink tint, default radius `pillow` (1.5rem) |
| Primary | Saturated magenta-pink, Valentino Pink PP register — used on **one** element per view |
| Secondary | Bubblegum mid-pink for hover/muted states |
| Accent | Crystal/silver metallic treatment for borders, hairlines, icon strokes (CSS gradient, not image) |
| Destructive | Deeper rose-red, in-palette |
| Foreground | Near-black with warm undertone, never `#000` |
| Display font | Shortlist of 3 licenced serifs/display scripts; phase 1 uses free Pangram Pangram equivalents |
| Motif | Heart · bow · butterfly · sparkle, SVG set, `currentColor`-driven |
| Cursor | Sparkle trail on landing/gallery only; desktop only |
| Sale moment | Full-bleed confetti burst |
| Texture | Subtle grain on landing hero, none on work surfaces |

### 5.2 Theme 2 — **Leopard** (animal print + luxury)

**Reference gestalt:** Dolce & Gabbana SS24 Leopard, Roberto Cavalli archive, Moschino Jeremy Scott animal era.

| Token | Direction |
|---|---|
| Background | Warm cream/bone (`oklch ~0.96 0.015 75`) — no cool whites anywhere |
| Surface/card | Cream with hair-darker border, default radius `tight` (0.5rem) — more tailored than Malibu |
| Primary | Rich tan/camel — warm leopard base tone |
| Secondary | Deep espresso brown for text emphasis and borders |
| Accent | Gold — proper 18k gold CSS gradient, Leopard's answer to Malibu's silver |
| Destructive | Burnt sienna/rust, in-palette |
| Foreground | Espresso, never pure black |
| Display font | Higher-contrast serifs; Dolce/Cavalli register; phase 1 free |
| Motif | Leopard spots at three intensities (off / 5% hairline texture / full print), gold spot pattern for accents |
| Cursor | Gold spot trail on landing only; subtler than Malibu sparkles |
| Sale moment | Gold leaf fall |
| Texture | Grain on landing + gallery; subtle cream-paper texture on cards |

### 5.3 Structural rules (both themes)

- Every display font licenced; phase 1 uses [Pangram Pangram](https://pangrampangram.com/) free-for-personal fonts, licence upgrade reserved for later.
- Every motif is an SVG React component committed to the repo; recolours via `currentColor`.
- Work surfaces **never** use the display font. Dashboard headings = Geist Sans semibold. KPI numbers = Geist Mono tabular figures.
- Theme toggle always visible in top nav.

## 6. Craft foundation (phase 1, the part that actually fixes "cheap")

Every bullet here happens regardless of theme. Skipping this phase means the themes land on unpolished scaffolding and the whole project fails.

### 6.1 Type and rhythm

- 8-step modular type scale (12/14/16/18/24/32/48/72) in CSS variables. Every heading/label/caption snaps to it. No ad-hoc `text-[17px]`.
- 4px spacing grid in CSS variables. Every padding/gap/margin is a multiple.
- Explicit line-heights per size.

### 6.2 Alignment discipline

- Shared container `max-w-[1280px]` with consistent side padding per breakpoint.
- Tables: numbers right, text left, money in Geist Mono tabular figures. Currency column widths pre-computed so nothing jitters on re-render.
- Card grids snap to 12-col desktop / 4 tablet / 1 mobile, gutters from spacing scale.

### 6.3 States (the biggest tell of unpolished work)

- Every loading surface: real skeleton shaped like the content, not a spinner.
- Every empty state: themed illustration + one line of copy in MG's voice ("Nothing stale — she's shifting it" etc.).
- Every error state: themed card, actionable, never "Something went wrong".
- Every success toast: themed. Sale = full-bleed moment.

### 6.4 Micro-interactions (60fps)

- Button hover / active / focus-visible distinct, not CSS defaults.
- Card hover: transform + shadow bloom, 200ms, `cubic-bezier(0.16, 1, 0.3, 1)`.
- Page transitions: fade/slide 180ms.
- Images: lazy-loaded with blur-up from low-res placeholder via `next/image`.

### 6.5 Image treatment

- Every item photo through `next/image`.
- Consistent aspect ratios per surface (square in gallery, 4:5 in editor, 16:9 in landing).
- Consistent container: themed radius, shadow, optional motif frame on hero photos.

### 6.6 Nav rebuild

- `components/nav.tsx` rebuilt: display-font wordmark, Geist work links, themed active-link underline motif, theme toggle, avatar. Sticky.

### 6.7 Craft review checklist

Committed as `docs/craft-review.md`. Every PR runs through a 12-point review before merge: skeleton? empty? error? success? type scale? grid? alignment? hover? focus? image treatment? responsive at 3 breakpoints? 60fps on mid-phone?

## 7. Dial system and bot-driven theme editing

The hero feature: MG can tell the bot to restyle the site. The architectural rule that makes this safe and shippable: **the bot never writes code or free-form CSS — it turns a fixed set of dials.**

### 7.1 Dial schema

Shared type in `taste-trawler/lib/theme-dials.ts`, imported by both the web app and the VPS bot:

```ts
type ThemeDials = {
  // Colour
  hueShift: number;      // -30..+30 degrees, rotates primary/secondary/accent together
  saturation: number;    // 0.5..1.5 multiplier
  brightness: number;    // 0.9..1.1 multiplier on background lightness

  // Shape
  radius: 'tight' | 'soft' | 'pillow';     // 0.5rem / 1rem / 1.5rem
  shadow: 'none' | 'subtle' | 'bloom';

  // Typography
  displayFont: string;   // enum of 3 shortlisted per theme
  headingScale: number;  // 0.85..1.3 multiplier on display sizes

  // Motif
  motifIntensity: 'off' | 'whisper' | 'present' | 'full';
  motifVariant: string;  // enum per theme

  // Moments
  sparkleCursor: boolean;
  saleCelebration: 'off' | 'subtle' | 'full';
};
```

Every dial has default, min/max (or enum), and human description used in the Gemini prompt. Anything outside the schema is rejected by Zod on both the bot side and the API side.

### 7.2 Data model change

Two new tables in `lib/db/schema.ts`:

```ts
themeSettings: pgTable('theme_settings', {
  themeName: text('theme_name').primaryKey(),    // 'malibu' | 'leopard'
  dials: jsonb('dials').$type<ThemeDials>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'),                 // 'mg' | 'james' | 'bot'
})

themeHistory: pgTable('theme_history', {
  id: serial('id').primaryKey(),
  themeName: text('theme_name').notNull(),
  dials: jsonb('dials').$type<ThemeDials>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

Keep last 10 history rows per theme; prune older on write.

### 7.3 Web-app consumption

- Root layout is a Server Component. On every request it reads both theme rows, cached via `unstable_cache` tagged `theme-settings`.
- Root renders a `<style>` block that injects CSS variable overrides under `.malibu` and `.leopard` scopes, computed from dials.
- Active theme class on `<html>` via `next-themes`, themes `['malibu','leopard','system']`, default `'malibu'`.
- Dial change triggers `revalidateTag('theme-settings')`. Next navigation reflects it. No realtime / websockets — MG is on WhatsApp and the bot tells her to refresh.

### 7.4 New API routes

- `POST /api/theme/adjust` — bearer-authed (`TT_API_KEY`), accepts `{ theme, patch }`, Zod-validates `patch` against `ThemeDials` schema, merges into current row, writes history snapshot, writes new row, revalidates tag. Returns new dial state.
- `GET /api/theme/:name` — returns current dials (for the bot to read state before proposing a diff).
- `POST /api/theme/:name/undo` — restores previous history snapshot.
- `POST /api/theme/:name/reset` — restores hard-coded defaults.

### 7.5 New bot tools (VPS, `/opt/taste-trawler-agent/tools.js`)

| Tool | Purpose |
|---|---|
| `tt_adjust_theme` | Interpret MG's instruction, call Gemini Flash with dial schema, validate diff, POST to `/api/theme/adjust` |
| `tt_undo_theme` | One-step undo via `/api/theme/:name/undo` |
| `tt_reset_theme` | Reset to defaults |

### 7.6 Gemini prompt for `tt_adjust_theme`

System prompt contains: full `ThemeDials` schema, human descriptions per dial, current dial state, allowed ranges, required JSON output shape (`{ patch: Partial<ThemeDials> } | { refusal: string }`).

User message = MG's raw instruction.

Local Zod validation of the returned diff before the API call. On refusal (instruction outside schema scope — "add a new page", "change the logo"), bot replies in MG's voice: *"Can't do that one — ask James."*

### 7.7 Safety rails

- Zod validation on bot side and API side.
- Undo stack of 10 per theme.
- Rate limit: max 20 adjustments per theme per 24h.
- Reset-to-defaults tool for when it inevitably gets run into chaos.
- Bearer auth on all `/api/theme/*` routes (same `TT_API_KEY` used for existing bot→web calls).

## 8. Phases

Five phases, each shippable, each leaves the app better than it started.

### Phase 1 — Craft foundation + token plumbing *(1–2 weeks of evenings)*

- Lock type scale, spacing scale, container widths in CSS variables.
- Rebuild `components/nav.tsx`.
- Craft pass across `/dashboard`, `/inventory`, `/workbench`: skeletons, empty states, error states, hover/focus states.
- Commit `docs/craft-review.md` 12-point checklist.
- Add `theme_settings` + `theme_history` tables, migration, `lib/theme.ts` reader with `unstable_cache` + tag.
- Wire `next-themes` with `['malibu','leopard','system']`, default `malibu`.
- Inject Pangram Pangram free display fonts via `next/font/local`.

**Exit criterion:** app still mostly monochrome but feels crafted. Cheap smell lifted.

### Phase 2 — Malibu theme full expression *(1 week)*

- Use v0 to generate landing hero, gallery grid, empty-state illustrations in Malibu spirit (paste Blumarine/Valentino refs).
- Bring v0 output back into repo, extract tokens into CSS variables under `.malibu` scope.
- Build motif SVG React component set (heart/bow/butterfly/sparkle).
- Sparkle cursor trail canvas component, landing + gallery only, desktop only.
- Sale celebration full-bleed animation.

**Exit criterion:** MG sees Malibu. Hero demo moment. Show it to her.

### Phase 3 — Leopard theme *(0.5 week)*

- Same process: v0 for landing + gallery in Leopard spirit, tokens extracted under `.leopard`.
- Leopard motif SVGs (spot pattern at 3 intensities, gold hairlines, leopard frame).
- Gold cursor trail variant.
- Theme toggle in nav functional with both themes.

**Exit criterion:** MG can flip between both themes, both complete and distinct.

### Phase 4 — Dial system + bot tool *(1 week)*

- `POST /api/theme/adjust`, `GET /api/theme/:name`, undo, reset.
- Shared Zod schema `lib/theme-dials.ts`.
- Add `tt_adjust_theme`, `tt_undo_theme`, `tt_reset_theme` to the VPS bot.
- Gemini Flash English→diff prompt with refusal handling.
- Rate limit, history writes, undo flow.

**Exit criterion:** MG tells bot "make it pinker", site changes on next refresh. Hero feature live.

### Phase 5 — Gallery + final polish *(0.5 week)*

- New route `/inventory/gallery` (editorial grid, linked to table view).
- Photo treatment pass: aspect ratios, blur-up, motif frames on hero photos.
- Final craft review across all theatre surfaces under both themes.
- Responsive check at 3 breakpoints, 60fps check on mid-phone.

**Exit criterion:** ship as "v2" to MG.

## 9. Tool split — honest acknowledgement

Claude (the author of this spec) is **not the best tool for the visual design work**. Specifically:

- Claude can't see. CSS is written blind and relies on the user to report what's broken — a slow loop for aesthetic work.
- Claude lacks typography *feel* — knows the rules, can't judge when a pairing "sings".
- Claude can't judge motion timing by watching.
- Claude's training cutoff (May 2025) is stale for a fast-moving aesthetic genre.
- Brand gestalt ("does this feel Blumarine or Juicy Couture knockoff?") is approximated, not nailed.

**Recommended tool split:**

- **[v0 by Vercel](https://v0.dev)** — visual exploration phase. Generate landing hero, gallery grid, empty-state illustrations from natural-language + reference screenshots (Blumarine, Moschino, Miu Miu). Output React/shadcn code straight into the repo.
- **Claude** — everything v0 is bad at: schema design, dial merge logic, `tt_adjust_theme` bot tool, Gemini prompt engineering, `revalidatePath` plumbing, CSS variable injection pattern, phased migration without breaking existing pages, craft-review enforcement.
- **Human designer** (~£500–£2k on Dribbble/Fiverr) — optional upgrade path if v0 output falls short. Higher ceiling, slower, more expensive.

Phase 2 and 3 should start in v0, not Claude. Claude integrates the output.

## 10. Explicit non-goals (restated)

- No API route restructuring.
- No schema changes beyond `theme_settings` + `theme_history`.
- No existing bot-tool changes — additions only.
- No per-user themes in phase 1.
- No Storybook / design-system docs site.
- No automated visual regression testing.
- No bot-driven JSX rewriting or free-form CSS — dials only.

## 11. Open questions (none blocking)

- Final names for themes — "Malibu" and "Leopard" are placeholders; MG override welcome.
- Font licence upgrade timing — deferred until phase 2 ships and MG confirms direction.
- Whether to split dials per-user if multiple people end up using the web app. Not needed phase 1.

## 12. Success criteria

1. MG, shown the v2 app cold, does not describe it as "cheap" or "unpolished".
2. MG successfully tells the bot to change the theme and watches the site reflect her instruction.
3. Existing operational functionality (item CRUD, stats, stale items, bot tools) is unchanged and unbroken.
4. Every page passes the 12-point craft review under both themes.
5. MG opens the web app voluntarily at least once a week in the month following v2 ship.

Criterion 5 is the only one that matters. The other four exist to make it happen.
