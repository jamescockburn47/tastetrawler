# Phase 1: Craft Foundation + Token Plumbing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the "cheap/unpolished" smell across every existing Taste Trawler page and lay the CSS-variable + Drizzle + next-themes plumbing that Phases 2–5 will build on. End state: app is still mostly monochrome but feels crafted, and the theme architecture is ready for Malibu/Leopard content to drop into.

**Architecture:** CSS custom properties define a locked type scale, spacing scale, and two theme class scopes (`.malibu`, `.leopard`). `next-themes` sets the active class on `<html>`. A server-side cache reader pulls per-theme dials from Neon and injects CSS variable overrides at request time. Two new Drizzle tables (`theme_settings`, `theme_history`) back the dial state. A shared Zod schema lives in `lib/theme-dials.ts` so the VPS bot can validate dial diffs against the same type. Craft pass rebuilds nav + replaces loose states on `/dashboard`, `/inventory`, `/workbench` with proper skeletons, empty states, error states, and hover/focus states.

**Tech Stack:** Next.js 16 (App Router, RSC, Turbopack), React 19, Tailwind CSS v4 with OKLCH, Drizzle ORM + Neon Postgres, next-themes, Clerk, Zod, `next/font/local` for Pangram Pangram free fonts.

**Testing approach:** This project has no test framework installed. Phase 1 is primarily CSS, RSC, and schema work where TDD is a poor fit. Each task ends with a **manual verification step** (run dev server, visit route, check expected behaviour). If you want automated tests added, stop and raise it before Task 1 — bolting on vitest is a scope change.

**Git hygiene:** Commit after every task. Never push — Vercel auto-deploys on push to `feat/phase1-mvp`, and phase 1 should ship as one reviewed block.

---

## File Structure

**New files:**
- `taste-trawler/app/fonts.ts` — `next/font/local` declarations for Pangram Pangram display fonts
- `taste-trawler/lib/theme-dials.ts` — shared Zod schema, TypeScript type, default dials per theme (imported later by VPS bot)
- `taste-trawler/lib/theme.ts` — server-side dial reader with `unstable_cache` + `revalidateTag`
- `taste-trawler/lib/theme-css.ts` — pure function that converts `ThemeDials` → CSS variable string
- `taste-trawler/components/providers.tsx` — client component wrapping `ThemeProvider` from next-themes
- `taste-trawler/components/page-container.tsx` — shared `max-w-[1280px]` container with consistent side padding
- `taste-trawler/components/empty-state.tsx` — themed empty-state component (illustration slot + copy)
- `taste-trawler/components/error-state.tsx` — themed error card with retry action
- `taste-trawler/components/skeletons/table-skeleton.tsx` — content-shaped skeleton for the item table
- `taste-trawler/components/skeletons/kpi-skeleton.tsx` — skeleton for KPI cards
- `taste-trawler/components/skeletons/card-grid-skeleton.tsx` — skeleton for gallery-style grids
- `taste-trawler/public/fonts/pangrampangram/` — downloaded `.woff2` font files (manual download step)
- `taste-trawler/docs/craft-review.md` — 12-point per-PR craft review checklist

**Modified files:**
- `taste-trawler/app/globals.css` — add type scale, spacing scale, `.malibu` / `.leopard` scopes with placeholder palettes
- `taste-trawler/app/layout.tsx` — remove hardcoded `className="dark"`, wrap in `Providers`, inject dial-driven CSS overrides, add `suppressHydrationWarning`
- `taste-trawler/components/nav.tsx` — rebuild with wordmark slot, theme toggle integration, themed underline on active link
- `taste-trawler/components/theme-toggle.tsx` — replace manual `data-theme` code with next-themes-backed toggle between `malibu` and `leopard`
- `taste-trawler/lib/db/schema.ts` — add `themeSettings` and `themeHistory` tables
- `taste-trawler/app/dashboard/page.tsx` — craft pass
- `taste-trawler/components/kpi-cards.tsx` — add skeleton + hover/focus states
- `taste-trawler/components/stale-items-panel.tsx` — add empty/error/loading states
- `taste-trawler/app/inventory/page.tsx` — craft pass
- `taste-trawler/components/item-table.tsx` — add skeleton + empty state + tabular figures
- `taste-trawler/app/workbench/page.tsx` — craft pass
- `taste-trawler/components/listing-editor.tsx` — focus-visible states, button craft
- `taste-trawler/components/pricing-panel.tsx` — focus-visible states
- `taste-trawler/components/photo-upload.tsx` — loading + error states

**Deleted files:** none

---

## Task 1: Lock type scale, spacing scale, and theme scopes in globals.css

**Files:**
- Modify: `taste-trawler/app/globals.css`

- [ ] **Step 1: Read the current file**

Read `taste-trawler/app/globals.css` in full. Confirm current structure: `@import "tailwindcss"`, `@custom-variant dark`, `@theme inline { ... }`, `:root { ... }`, `.dark { ... }`, `@layer base`.

- [ ] **Step 2: Add type scale + spacing scale + container tokens inside `@theme inline`**

Replace the existing `@theme inline { ... }` block with the following (keep every existing line and append the new sections marked `/* added phase 1 */`):

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: "Geist Mono", "Geist Mono Fallback", ui-monospace, monospace;
  --font-heading: var(--font-sans);
  --font-display: var(--font-display);               /* added phase 1: theme-specific display font */
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);

  /* added phase 1: locked modular type scale */
  --text-2xs: 0.6875rem;    /* 11px — captions only */
  --text-xs:  0.75rem;      /* 12px */
  --text-sm:  0.875rem;     /* 14px — body small */
  --text-base: 1rem;        /* 16px — body */
  --text-lg:  1.125rem;     /* 18px */
  --text-xl:  1.5rem;       /* 24px */
  --text-2xl: 2rem;         /* 32px */
  --text-3xl: 3rem;         /* 48px — display */
  --text-4xl: 4.5rem;       /* 72px — hero display */

  /* added phase 1: line-heights pinned per step */
  --leading-tight: 1.05;
  --leading-snug:  1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* added phase 1: 4px spacing grid (aliases so Tailwind utilities remain) */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* added phase 1: page container */
  --container-max: 1280px;
  --container-pad-sm: 1rem;
  --container-pad-md: 1.5rem;
  --container-pad-lg: 2rem;
}
```

- [ ] **Step 3: Add `.malibu` and `.leopard` theme scopes below the existing `.dark` block**

Append to the end of the file, before the `@layer base` block:

```css
/* added phase 1: Malibu theme — placeholder palette, real values land in phase 2 */
.malibu {
  --background: oklch(0.985 0.006 20);
  --foreground: oklch(0.18 0.02 20);
  --card: oklch(0.995 0.004 20);
  --card-foreground: oklch(0.18 0.02 20);
  --popover: oklch(0.995 0.004 20);
  --popover-foreground: oklch(0.18 0.02 20);
  --primary: oklch(0.62 0.26 350);             /* hot pink placeholder */
  --primary-foreground: oklch(0.99 0.004 20);
  --secondary: oklch(0.95 0.04 350);
  --secondary-foreground: oklch(0.3 0.08 350);
  --muted: oklch(0.96 0.015 20);
  --muted-foreground: oklch(0.48 0.03 20);
  --accent: oklch(0.94 0.03 350);
  --accent-foreground: oklch(0.3 0.1 350);
  --destructive: oklch(0.58 0.22 15);
  --border: oklch(0.92 0.02 350);
  --input: oklch(0.92 0.02 350);
  --ring: oklch(0.62 0.26 350 / 40%);
  --chart-1: oklch(0.62 0.26 350);
  --chart-2: oklch(0.72 0.18 350);
  --chart-3: oklch(0.82 0.12 350);
  --chart-4: oklch(0.5 0.08 20);
  --chart-5: oklch(0.35 0.04 20);
  --radius: 1.25rem;                           /* pillow default */
  --sidebar: oklch(0.99 0.004 20);
  --sidebar-foreground: oklch(0.18 0.02 20);
  --sidebar-primary: oklch(0.62 0.26 350);
  --sidebar-primary-foreground: oklch(0.99 0.004 20);
  --sidebar-accent: oklch(0.94 0.03 350);
  --sidebar-accent-foreground: oklch(0.3 0.1 350);
  --sidebar-border: oklch(0.92 0.02 350);
  --sidebar-ring: oklch(0.62 0.26 350 / 40%);
}

/* added phase 1: Leopard theme — placeholder palette, real values land in phase 3 */
.leopard {
  --background: oklch(0.96 0.015 75);
  --foreground: oklch(0.22 0.04 55);
  --card: oklch(0.975 0.012 75);
  --card-foreground: oklch(0.22 0.04 55);
  --popover: oklch(0.975 0.012 75);
  --popover-foreground: oklch(0.22 0.04 55);
  --primary: oklch(0.55 0.1 60);              /* tan/camel placeholder */
  --primary-foreground: oklch(0.98 0.01 75);
  --secondary: oklch(0.32 0.06 45);            /* espresso */
  --secondary-foreground: oklch(0.98 0.01 75);
  --muted: oklch(0.93 0.018 75);
  --muted-foreground: oklch(0.5 0.04 55);
  --accent: oklch(0.7 0.12 80);                /* gold stand-in */
  --accent-foreground: oklch(0.22 0.04 55);
  --destructive: oklch(0.52 0.18 35);          /* burnt sienna */
  --border: oklch(0.9 0.02 75);
  --input: oklch(0.9 0.02 75);
  --ring: oklch(0.55 0.1 60 / 40%);
  --chart-1: oklch(0.55 0.1 60);
  --chart-2: oklch(0.7 0.12 80);
  --chart-3: oklch(0.32 0.06 45);
  --chart-4: oklch(0.45 0.08 55);
  --chart-5: oklch(0.62 0.1 70);
  --radius: 0.5rem;                            /* tight default */
  --sidebar: oklch(0.975 0.012 75);
  --sidebar-foreground: oklch(0.22 0.04 55);
  --sidebar-primary: oklch(0.55 0.1 60);
  --sidebar-primary-foreground: oklch(0.98 0.01 75);
  --sidebar-accent: oklch(0.93 0.018 75);
  --sidebar-accent-foreground: oklch(0.32 0.06 45);
  --sidebar-border: oklch(0.9 0.02 75);
  --sidebar-ring: oklch(0.55 0.1 60 / 40%);
}
```

These palettes are placeholders. Phase 2/3 replace them with v0-generated token sets. Phase 1 only needs *structural* separation so the rest of the plan has scopes to bind into.

- [ ] **Step 4: Verify dev server compiles**

Run: `cd taste-trawler && npm run dev`
Visit: `http://localhost:3000/dashboard`
Expected: page renders without CSS errors in the terminal. App will still look the same because `.malibu` / `.leopard` are not yet applied to `<html>`.
Stop the dev server.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/app/globals.css
git commit -m "feat(css): lock type/spacing scale + malibu/leopard theme scopes"
```

---

## Task 2: Download Pangram Pangram fonts and register via `next/font/local`

**Files:**
- Create: `taste-trawler/public/fonts/pangrampangram/` (directory with font files)
- Create: `taste-trawler/app/fonts.ts`

- [ ] **Step 1: Download two free Pangram Pangram display fonts** (manual user step)

Open https://pangrampangram.com/ in a browser. Download these two families (both free for personal use):
- **Editorial New** (one weight suffices: Regular or Medium) — phase 1 Malibu display
- **Migra** or **PP Neue Machina** (one weight) — phase 1 Leopard display

If any of these are not free at time of download, substitute the closest free Pangram Pangram serif (for Malibu) and condensed/display sans (for Leopard). Note the substitution in the commit message.

Extract the `.woff2` files and copy them into:

```
taste-trawler/public/fonts/pangrampangram/
  ├── editorial-new-regular.woff2
  └── migra-regular.woff2      (or the substituted filename)
```

- [ ] **Step 2: Create `taste-trawler/app/fonts.ts`**

Create the file with this exact content (adjust file paths to match whatever you actually downloaded):

```ts
import localFont from 'next/font/local';

/**
 * Malibu display font — serif with editorial contrast.
 * Placeholder licence: Pangram Pangram free-for-personal. Upgrade path
 * reserved for phase 2 once MG confirms direction.
 */
export const malibuDisplay = localFont({
  src: '../public/fonts/pangrampangram/editorial-new-regular.woff2',
  variable: '--font-display-malibu',
  display: 'swap',
  weight: '400',
});

/**
 * Leopard display font — condensed / high-contrast display sans.
 */
export const leopardDisplay = localFont({
  src: '../public/fonts/pangrampangram/migra-regular.woff2',
  variable: '--font-display-leopard',
  display: 'swap',
  weight: '400',
});
```

- [ ] **Step 3: Wire font variables into `app/layout.tsx` body className**

Read `taste-trawler/app/layout.tsx`. Modify the imports and the `<body>` tag to attach both display-font variables alongside the existing Geist ones. Leave the rest of the file alone for now — Task 6 will restructure layout.tsx further.

Change:

```tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
```

to:

```tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { malibuDisplay, leopardDisplay } from './fonts';
```

and change the `<body>` tag from:

```tsx
<body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-background text-foreground`}>
```

to:

```tsx
<body className={`${GeistSans.variable} ${GeistMono.variable} ${malibuDisplay.variable} ${leopardDisplay.variable} font-sans antialiased bg-background text-foreground`}>
```

- [ ] **Step 4: Bind display font variables to their theme scopes in `globals.css`**

Append to the end of the `.malibu { ... }` block (before the closing brace):

```css
  --font-display: var(--font-display-malibu);
```

Append to the end of the `.leopard { ... }` block (before the closing brace):

```css
  --font-display: var(--font-display-leopard);
```

- [ ] **Step 5: Verify build**

Run: `cd taste-trawler && npm run dev`
Open devtools → Network → Fonts filter. Visit `http://localhost:3000/dashboard`.
Expected: two new `.woff2` requests for the Pangram Pangram files, 200 status. No console errors.
Stop the dev server.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/public/fonts/pangrampangram/ taste-trawler/app/fonts.ts taste-trawler/app/layout.tsx taste-trawler/app/globals.css
git commit -m "feat(fonts): register Pangram Pangram display fonts for malibu/leopard"
```

---

## Task 3: Add `theme_settings` and `theme_history` Drizzle tables

**Files:**
- Modify: `taste-trawler/lib/db/schema.ts`
- Create: `taste-trawler/drizzle/0002_*.sql` (auto-generated)

- [ ] **Step 1: Add table definitions to `lib/db/schema.ts`**

Open `taste-trawler/lib/db/schema.ts`. Add this block immediately before the type exports at the bottom (`export type Item = ...`):

```ts
/**
 * theme_settings — one row per theme ('malibu' | 'leopard'). `dials` is
 * the current JSONB blob validated against lib/theme-dials.ts schema.
 * Written by the VPS bot via /api/theme/adjust (phase 4) and by James
 * via admin UI (not yet built).
 */
export const themeSettings = pgTable('theme_settings', {
  themeName: text('theme_name').primaryKey(),
  dials: jsonb('dials').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'), // 'mg' | 'james' | 'bot'
});

/**
 * theme_history — last ~10 snapshots per theme for undo. Pruned on write.
 */
export const themeHistory = pgTable('theme_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  themeName: text('theme_name').notNull(),
  dials: jsonb('dials').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ThemeSettings = typeof themeSettings.$inferSelect;
export type NewThemeSettings = typeof themeSettings.$inferInsert;
export type ThemeHistoryRow = typeof themeHistory.$inferSelect;
```

Note: `dials` is typed as `Record<string, unknown>` in the Drizzle layer because the strong typing lives in `lib/theme-dials.ts` (Task 4). Reads and writes cast through the Zod schema, not the Drizzle type.

- [ ] **Step 2: Generate the migration**

Run: `cd taste-trawler && npx drizzle-kit generate`
Expected: a new SQL file at `taste-trawler/drizzle/0002_*.sql` is created. Open it and confirm it contains `CREATE TABLE "theme_settings"` and `CREATE TABLE "theme_history"` with the columns above. If it contains anything else (unrelated ALTERs), stop and investigate before running it.

- [ ] **Step 3: Apply the migration to Neon**

Run: `cd taste-trawler && npx drizzle-kit migrate`
Expected: command exits successfully. If `DATABASE_URL` is not set, pull it with `vercel env pull .env.local` first (but note Vercel CLI may not be installed — see CLAUDE.md; fall back to copying from the Neon dashboard).

- [ ] **Step 4: Verify tables exist**

Run a quick query from a throwaway script, or open the Neon dashboard → Tables. Confirm both `theme_settings` and `theme_history` exist and are empty.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/lib/db/schema.ts taste-trawler/drizzle/0002_*.sql taste-trawler/drizzle/meta/
git commit -m "feat(db): add theme_settings + theme_history tables"
```

---

## Task 4: Shared dial schema in `lib/theme-dials.ts`

**Files:**
- Create: `taste-trawler/lib/theme-dials.ts`

- [ ] **Step 1: Confirm Zod is available**

Run: `cd taste-trawler && npm ls zod`
If zod is not listed, install it: `npm install zod`
(zod is a peer dep of `ai` and `@clerk/nextjs` so it's likely already resolved; verify before committing.)

- [ ] **Step 2: Create the file with full schema**

Create `taste-trawler/lib/theme-dials.ts`:

```ts
/**
 * Shared dial schema for the Malibu and Leopard themes.
 *
 * This file is imported by:
 *   - the web app (taste-trawler) to read/write dial state
 *   - the VPS bot (/opt/taste-trawler-agent) via a copied source in phase 4
 *
 * DO NOT import Node-only modules here — it must compile to plain JS
 * when copied onto the bot VPS.
 */
import { z } from 'zod';

export const themeNameSchema = z.enum(['malibu', 'leopard']);
export type ThemeName = z.infer<typeof themeNameSchema>;

export const radiusSchema = z.enum(['tight', 'soft', 'pillow']);
export const shadowSchema = z.enum(['none', 'subtle', 'bloom']);
export const motifIntensitySchema = z.enum(['off', 'whisper', 'present', 'full']);
export const saleCelebrationSchema = z.enum(['off', 'subtle', 'full']);

export const malibuMotifSchema = z.enum(['heart', 'bow', 'butterfly', 'sparkle']);
export const leopardMotifSchema = z.enum(['spots', 'gold-spots', 'leopard-frame']);

export const malibuDisplayFontSchema = z.enum([
  'editorial-new',
  'recoleta',    // reserved for licence upgrade
  'saol-display', // reserved for licence upgrade
]);

export const leopardDisplayFontSchema = z.enum([
  'migra',
  'canela-deck', // reserved for licence upgrade
  'pp-neue-machina', // reserved for licence upgrade
]);

/** Dials shared by both themes. */
const commonDialsShape = {
  hueShift: z.number().min(-30).max(30).default(0),
  saturation: z.number().min(0.5).max(1.5).default(1),
  brightness: z.number().min(0.9).max(1.1).default(1),
  radius: radiusSchema.default('soft'),
  shadow: shadowSchema.default('subtle'),
  headingScale: z.number().min(0.85).max(1.3).default(1),
  motifIntensity: motifIntensitySchema.default('present'),
  sparkleCursor: z.boolean().default(true),
  saleCelebration: saleCelebrationSchema.default('full'),
};

export const malibuDialsSchema = z.object({
  ...commonDialsShape,
  displayFont: malibuDisplayFontSchema.default('editorial-new'),
  motifVariant: malibuMotifSchema.default('sparkle'),
  radius: radiusSchema.default('pillow'),
});

export const leopardDialsSchema = z.object({
  ...commonDialsShape,
  displayFont: leopardDisplayFontSchema.default('migra'),
  motifVariant: leopardMotifSchema.default('spots'),
  radius: radiusSchema.default('tight'),
});

export type MalibuDials = z.infer<typeof malibuDialsSchema>;
export type LeopardDials = z.infer<typeof leopardDialsSchema>;
export type ThemeDials = MalibuDials | LeopardDials;

export const defaultMalibuDials: MalibuDials = malibuDialsSchema.parse({});
export const defaultLeopardDials: LeopardDials = leopardDialsSchema.parse({});

/** Partial schemas for safe bot-driven diffs. */
export const malibuDialsPatchSchema = malibuDialsSchema.partial();
export const leopardDialsPatchSchema = leopardDialsSchema.partial();
export type MalibuDialsPatch = z.infer<typeof malibuDialsPatchSchema>;
export type LeopardDialsPatch = z.infer<typeof leopardDialsPatchSchema>;

/** Pick the right schema for a theme name. */
export function getDialsSchema(theme: ThemeName) {
  return theme === 'malibu' ? malibuDialsSchema : leopardDialsSchema;
}
export function getDialsPatchSchema(theme: ThemeName) {
  return theme === 'malibu' ? malibuDialsPatchSchema : leopardDialsPatchSchema;
}
export function getDefaultDials(theme: ThemeName): ThemeDials {
  return theme === 'malibu' ? defaultMalibuDials : defaultLeopardDials;
}
```

- [ ] **Step 3: Verify it type-checks**

Run: `cd taste-trawler && npx tsc --noEmit`
Expected: no errors in `lib/theme-dials.ts`. If errors appear in unrelated files, they are pre-existing — note but do not fix in this task.

- [ ] **Step 4: Verify schema parses defaults**

Create a temporary scratch file `taste-trawler/scratch-verify.ts`:

```ts
import { defaultMalibuDials, defaultLeopardDials, malibuDialsSchema } from './lib/theme-dials';
console.log('malibu defaults:', defaultMalibuDials);
console.log('leopard defaults:', defaultLeopardDials);
console.log('patch parses:', malibuDialsSchema.partial().parse({ hueShift: 10 }));
```

Run: `cd taste-trawler && npx tsx scratch-verify.ts`
Expected: prints three objects, no thrown errors. Malibu `radius` should be `'pillow'`, Leopard `'tight'`.
Delete the scratch file: `rm taste-trawler/scratch-verify.ts`

If `tsx` is not installed, use `npx ts-node --esm scratch-verify.ts` or convert to a `.mjs` with explicit Zod imports.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/lib/theme-dials.ts taste-trawler/package.json taste-trawler/package-lock.json
git commit -m "feat(theme): shared Zod dial schema for malibu + leopard"
```

---

## Task 5: Server-side dial reader in `lib/theme.ts`

**Files:**
- Create: `taste-trawler/lib/theme.ts`
- Create: `taste-trawler/lib/theme-css.ts`

- [ ] **Step 1: Create `lib/theme-css.ts` — pure dial → CSS variable stringifier**

Create `taste-trawler/lib/theme-css.ts`:

```ts
/**
 * Pure function: given a theme name and current dials, produce the CSS
 * variable overrides to inject into a <style> block in the root layout.
 *
 * Phase 1 implements the minimum set of mappings needed to prove the
 * pipeline. Additional dials (hue shift, saturation, motif intensity)
 * gain CSS impact in phase 2/3 as the token sets fill out.
 */
import type { ThemeName, ThemeDials } from './theme-dials';

const radiusToRem: Record<'tight' | 'soft' | 'pillow', string> = {
  tight: '0.5rem',
  soft: '1rem',
  pillow: '1.5rem',
};

export function dialsToCssBlock(theme: ThemeName, dials: ThemeDials): string {
  const radius = radiusToRem[dials.radius];
  const headingScale = dials.headingScale.toFixed(3);
  return `.${theme}{--radius:${radius};--heading-scale:${headingScale};}`;
}

export function allThemeCssBlocks(
  entries: Array<{ theme: ThemeName; dials: ThemeDials }>,
): string {
  return entries.map(({ theme, dials }) => dialsToCssBlock(theme, dials)).join('');
}
```

- [ ] **Step 2: Create `lib/theme.ts` — cached reader**

Create `taste-trawler/lib/theme.ts`:

```ts
import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from './db';
import { themeSettings } from './db/schema';
import { eq } from 'drizzle-orm';
import {
  type ThemeName,
  type ThemeDials,
  getDialsSchema,
  getDefaultDials,
} from './theme-dials';

const THEME_CACHE_TAG = 'theme-settings';

/**
 * Read current dials for a theme. Falls back to hard-coded defaults if
 * no row exists (first-boot safety). Cached per theme name with a
 * shared tag so `revalidateTag('theme-settings')` invalidates all
 * themes in one call.
 */
export async function readThemeDials(theme: ThemeName): Promise<ThemeDials> {
  return readCached(theme);
}

const readCached = unstable_cache(
  async (theme: ThemeName): Promise<ThemeDials> => {
    const rows = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.themeName, theme))
      .limit(1);

    if (rows.length === 0) {
      return getDefaultDials(theme);
    }

    // Validate DB blob against the current schema. If schema has evolved
    // and the DB is stale, parse() fills in missing fields with defaults.
    const schema = getDialsSchema(theme);
    const parsed = schema.safeParse(rows[0].dials);
    return parsed.success ? parsed.data : getDefaultDials(theme);
  },
  ['theme-settings-v1'],
  { tags: [THEME_CACHE_TAG] },
);

export async function readAllThemes(): Promise<
  Array<{ theme: ThemeName; dials: ThemeDials }>
> {
  const themes: ThemeName[] = ['malibu', 'leopard'];
  return Promise.all(
    themes.map(async (theme) => ({ theme, dials: await readThemeDials(theme) })),
  );
}

export function invalidateThemeCache() {
  revalidateTag(THEME_CACHE_TAG);
}
```

- [ ] **Step 3: Confirm `lib/db` export shape**

Run: `grep -n "export" taste-trawler/lib/db/index.ts 2>/dev/null || ls taste-trawler/lib/db/`
Expected: there is a `db` export. If `lib/db/index.ts` doesn't exist, find where `db` comes from in existing API routes (e.g. `app/api/items/route.ts`) and update the import in `theme.ts` to match.

- [ ] **Step 4: Verify type-check**

Run: `cd taste-trawler && npx tsc --noEmit`
Expected: no new errors in `lib/theme.ts` or `lib/theme-css.ts`.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/lib/theme.ts taste-trawler/lib/theme-css.ts
git commit -m "feat(theme): cached dial reader + CSS stringifier"
```

---

## Task 6: Wire next-themes + inject dial CSS in root layout

**Files:**
- Create: `taste-trawler/components/providers.tsx`
- Modify: `taste-trawler/app/layout.tsx`
- Modify: `taste-trawler/components/theme-toggle.tsx`

- [ ] **Step 1: Create `components/providers.tsx`**

Create `taste-trawler/components/providers.tsx`:

```tsx
'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Client-side theme provider. Themes are `malibu` and `leopard` — there
 * is no `system` mode because the themes aren't light/dark variants of
 * a single aesthetic.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="malibu"
      themes={['malibu', 'leopard']}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Rewrite `app/layout.tsx`**

Replace the contents of `taste-trawler/app/layout.tsx` with:

```tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Nav } from '@/components/nav';
import { Providers } from '@/components/providers';
import { readAllThemes } from '@/lib/theme';
import { allThemeCssBlocks } from '@/lib/theme-css';
import { malibuDisplay, leopardDisplay } from './fonts';
import './globals.css';

export const metadata = {
  title: 'Taste Trawler',
  description: 'AI-powered resale assistant',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themes = await readAllThemes();
  const cssOverrides = allThemeCssBlocks(themes);

  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Dial-driven CSS variable overrides, computed at request time */}
          <style dangerouslySetInnerHTML={{ __html: cssOverrides }} />
        </head>
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} ${malibuDisplay.variable} ${leopardDisplay.variable} font-sans antialiased bg-background text-foreground`}
        >
          <Providers>
            <Nav />
            <main className="mx-auto max-w-[var(--container-max)] px-[var(--container-pad-sm)] md:px-[var(--container-pad-md)] lg:px-[var(--container-pad-lg)] py-6">
              {children}
            </main>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

Key changes from the current layout:
- Removed hardcoded `className="dark"` from `<html>` (next-themes manages it via class attribute now)
- Added `suppressHydrationWarning` on `<html>` (required by next-themes to avoid SSR mismatch warnings)
- Root layout is now `async` and reads theme dials server-side
- Injects dial-driven CSS overrides in a `<style>` block
- Wraps children in `<Providers>`
- `<main>` uses the new container tokens instead of `max-w-screen-xl`

- [ ] **Step 3: Replace `components/theme-toggle.tsx`**

Replace the full contents of `taste-trawler/components/theme-toggle.tsx` with:

```tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Theme toggle cycling between 'malibu' and 'leopard'. Uses next-themes
 * so the class on <html> is managed consistently with SSR and no FOUC.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Switch theme"
        className="h-8 w-24 rounded-full border border-border bg-muted/30"
      />
    );
  }

  const isMalibu = theme === 'malibu';
  const label = isMalibu ? 'Leopard' : 'Malibu';

  return (
    <button
      type="button"
      onClick={() => setTheme(isMalibu ? 'leopard' : 'malibu')}
      aria-label={`Switch to ${label} theme`}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-border px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span aria-hidden>{isMalibu ? '🐆' : '✨'}</span>
      {label}
    </button>
  );
}
```

Phase 2/3 will replace the emoji placeholders with proper SVG motif glyphs.

- [ ] **Step 4: Verify end-to-end**

Run: `cd taste-trawler && npm run dev`
Visit `http://localhost:3000/dashboard` and:
1. Open devtools → Elements. Inspect `<html>`: it should have `class="malibu"` on first load.
2. Inspect `<head>`: there should be a `<style>` block containing `.malibu{...}` and `.leopard{...}` rules.
3. The page should render (palette will look pinkish-off-white because `.malibu` is now active).
4. Click the theme toggle in the top-right. `<html>` class should change to `leopard` and the page should reflect the cream palette.
5. Refresh the page. The last-selected theme should persist (localStorage via next-themes).

Check the terminal for any hydration warnings. `suppressHydrationWarning` should silence the expected next-themes one; anything else indicates a real bug.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/components/providers.tsx taste-trawler/app/layout.tsx taste-trawler/components/theme-toggle.tsx
git commit -m "feat(theme): wire next-themes + inject dial CSS in root layout"
```

---

## Task 7: Shared layout primitives — `page-container`, `empty-state`, `error-state`

**Files:**
- Create: `taste-trawler/components/page-container.tsx`
- Create: `taste-trawler/components/empty-state.tsx`
- Create: `taste-trawler/components/error-state.tsx`

- [ ] **Step 1: Create `page-container.tsx`**

Create `taste-trawler/components/page-container.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared page container. Every page sits inside this so side padding and
 * max-width are consistent across routes. Do not use `max-w-screen-xl`
 * ad-hoc anymore — prefer this.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[var(--container-max)]',
        'px-[var(--container-pad-sm)] md:px-[var(--container-pad-md)] lg:px-[var(--container-pad-lg)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section header used above each block of content. Title uses the body
 * font (NOT the display font) — display font is reserved for theatre
 * surfaces only, per the design spec.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
```

- [ ] **Step 2: Create `empty-state.tsx`**

Create `taste-trawler/components/empty-state.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Themed empty state. In phase 1 the illustration slot is optional and
 * accepts any ReactNode; phase 2/3 will ship theme-specific SVG
 * illustrations that slot in here.
 */
export function EmptyState({
  title,
  description,
  illustration,
  action,
  className,
}: {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-dashed border-border bg-muted/30 px-6 py-12 text-center',
        className,
      )}
    >
      {illustration && (
        <div className="flex h-16 w-16 items-center justify-center text-4xl text-muted-foreground">
          {illustration}
        </div>
      )}
      <div className="max-w-md space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Create `error-state.tsx`**

Create `taste-trawler/components/error-state.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Themed error state for use inside route segments and components.
 * Never renders a red banner — the destructive token carries the weight.
 */
export function ErrorState({
  title = 'Something tripped up.',
  description,
  retry,
  className,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-[var(--radius)] border border-destructive/30 bg-destructive/5 px-6 py-6',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-1 inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Small helper: render this from Next.js route-segment `error.tsx` files.
 */
export function RouteErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="This page didn't load."
      description={
        error.digest
          ? `Reference: ${error.digest}. Ask James to check the Vercel logs.`
          : error.message
      }
      retry={reset}
    />
  );
}
```

- [ ] **Step 4: Type-check**

Run: `cd taste-trawler && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/components/page-container.tsx taste-trawler/components/empty-state.tsx taste-trawler/components/error-state.tsx
git commit -m "feat(ui): add PageContainer, EmptyState, ErrorState primitives"
```

---

## Task 8: Content-shaped skeletons

**Files:**
- Create: `taste-trawler/components/skeletons/table-skeleton.tsx`
- Create: `taste-trawler/components/skeletons/kpi-skeleton.tsx`
- Create: `taste-trawler/components/skeletons/card-grid-skeleton.tsx`

- [ ] **Step 1: Confirm a base `Skeleton` primitive exists**

Run: `ls taste-trawler/components/ui/skeleton.tsx 2>&1`
If it does not exist, create it with:

```tsx
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-[var(--radius-sm)] bg-muted', className)}
      {...props}
    />
  );
}
```

If it does exist, read it and confirm it uses `animate-pulse` and `bg-muted`. If it uses different tokens, leave it alone and reuse it as-is in the skeletons below.

- [ ] **Step 2: Create `skeletons/table-skeleton.tsx`**

Create `taste-trawler/components/skeletons/table-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton matching the shape of the inventory table: a header row plus
 * N content rows. Rows mirror the real column widths so the page
 * doesn't jump on data arrival.
 */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading inventory" className="w-full">
      <div className="mb-2 flex items-center gap-4 border-b border-border pb-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-10 w-10 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `skeletons/kpi-skeleton.tsx`**

Create `taste-trawler/components/skeletons/kpi-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for the 4-up KPI row on the dashboard. Matches the final card
 * layout so the dashboard doesn't reshuffle when real numbers arrive.
 */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius)] border border-border bg-card p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `skeletons/card-grid-skeleton.tsx`**

Create `taste-trawler/components/skeletons/card-grid-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for gallery-style grids. Used by the workbench browse view
 * and (in phase 5) the new inventory gallery.
 */
export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading items"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-[var(--radius)]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Type-check**

Run: `cd taste-trawler && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/components/skeletons/ taste-trawler/components/ui/skeleton.tsx
git commit -m "feat(ui): content-shaped skeletons for table, KPI, and card grid"
```

---

## Task 9: Rebuild `components/nav.tsx` with theme toggle integrated

**Files:**
- Modify: `taste-trawler/components/nav.tsx`

- [ ] **Step 1: Read existing nav**

Already inspected — current file is 32 lines, uses `max-w-screen-xl`, has no theme toggle, wordmark uses `font-mono`.

- [ ] **Step 2: Replace `components/nav.tsx` contents in full**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/workbench', label: 'Workbench' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[var(--container-max)] items-center justify-between gap-4 px-[var(--container-pad-sm)] md:h-16 md:px-[var(--container-pad-md)] lg:px-[var(--container-pad-lg)]">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-base tracking-tight text-foreground md:text-lg"
          >
            Taste Trawler
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-primary"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}
```

Design notes:
- Wordmark uses `font-[family-name:var(--font-display)]` — it's the ONE surface where the display font lives in phase 1. When Malibu is active, the wordmark shifts to Editorial New; when Leopard is active, to Migra. This is the preview of what themes will feel like.
- Active link uses a themed `bg-primary` underline absolutely positioned — matches the motif-underline direction in the spec.
- Sticky + backdrop blur so it survives scrolling over hero content in later phases.
- Mobile: link list hidden below `md` (phase 5 adds a Sheet for mobile nav; out of scope here).
- `focus-visible:ring-*` on every interactive element — lifts the app out of shadcn-default.

- [ ] **Step 3: Verify in browser**

Run: `cd taste-trawler && npm run dev`
Visit `http://localhost:3000/dashboard`. Expected:
1. Wordmark is serif-ish (Malibu = Editorial New). Toggle to Leopard — wordmark changes font.
2. Active nav link has a primary-coloured underline bar beneath it.
3. Tab key cycles through links with visible focus rings.
4. Nav sticks on scroll.
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/components/nav.tsx
git commit -m "feat(nav): rebuild with display-font wordmark + themed active underline + focus rings"
```

---

## Task 10: Craft pass — `/dashboard`

**Files:**
- Modify: `taste-trawler/app/dashboard/page.tsx`
- Modify: `taste-trawler/components/kpi-cards.tsx`
- Modify: `taste-trawler/components/stale-items-panel.tsx`

- [ ] **Step 1: Read current dashboard files**

Read all three files listed above. Note:
- Whether the page is Server Component or Client Component
- How data is fetched (direct Drizzle, fetch to internal route, SWR, etc.)
- Which KPI values exist and their formatting
- How loading/empty/error are currently (or aren't) handled

- [ ] **Step 2: Wrap dashboard in `PageContainer` + `PageHeader`**

Edit `taste-trawler/app/dashboard/page.tsx`. At the top of the returned JSX, wrap the existing content:

```tsx
import { PageContainer, PageHeader } from '@/components/page-container';
// ... other imports

export default /* async? */ function DashboardPage() {
  // ... existing data fetching

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Stock, sales, and the stale-items panel — the numbers MG runs the shop on."
      />
      {/* existing children */}
    </PageContainer>
  );
}
```

If the page currently uses raw top-level `<div>` wrappers with ad-hoc classes, remove them; the container handles width and padding.

- [ ] **Step 3: Add `<Suspense>` boundaries with skeletons around KPI and stale-items panels**

Restructure the dashboard JSX so each async boundary is wrapped:

```tsx
import { Suspense } from 'react';
import { KpiSkeleton } from '@/components/skeletons/kpi-skeleton';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
// ... other imports

// Inside the component return:
<section className="space-y-8">
  <Suspense fallback={<KpiSkeleton />}>
    <KpiCards />
  </Suspense>

  <div>
    <h2 className="mb-4 text-lg font-semibold tracking-tight">Stale items</h2>
    <Suspense fallback={<TableSkeleton rows={5} />}>
      <StaleItemsPanel />
    </Suspense>
  </div>
</section>
```

If the existing `KpiCards` / `StaleItemsPanel` are not Server Components (they receive data as props from the page), do NOT force-convert them — instead, render the skeleton conditionally on a loading prop, or leave the Suspense wrapper for data fetches that *are* async. Preserve existing data flow; only add craft on top of it.

- [ ] **Step 4: Add empty state to `StaleItemsPanel`**

Edit `taste-trawler/components/stale-items-panel.tsx`. Where it currently returns `null` or an empty `<table>` when there are no stale items, replace with:

```tsx
import { EmptyState } from '@/components/empty-state';

// inside the render:
if (!staleItems || staleItems.length === 0) {
  return (
    <EmptyState
      title="Nothing stale — she's shifting it."
      description="Items that sit listed for 14+ days without a sale will show up here. Clean slate for now."
      illustration={<span aria-hidden>✨</span>}
    />
  );
}
```

- [ ] **Step 5: Tabular figures + hover states on KPI cards**

Edit `taste-trawler/components/kpi-cards.tsx`. For each KPI value display, add:
- `font-mono` on the number
- `[font-feature-settings:'tnum']` on the number (tabular figures prevent jitter)
- Wrap each card's outer element with:

```tsx
className="group rounded-[var(--radius)] border border-border bg-card p-5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
```

- [ ] **Step 6: Add `error.tsx` for the dashboard route segment**

Create `taste-trawler/app/dashboard/error.tsx`:

```tsx
'use client';

import { RouteErrorFallback } from '@/components/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} />;
}
```

- [ ] **Step 7: Manual verification**

Run: `cd taste-trawler && npm run dev`
Visit `/dashboard`. Expected:
1. Page has a proper header with title + description.
2. On initial load, either the real KPIs render or a skeleton appears first.
3. Hovering a KPI card lifts it slightly and shows a shadow bloom.
4. KPI numbers use the mono font with no jitter.
5. If you temporarily throw an error inside the page to test: `throw new Error('test')` — the error UI shows the themed error card, not a crash.
6. Stale items empty state shows the themed message when there are none.
Stop the dev server.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/app/dashboard/ taste-trawler/components/kpi-cards.tsx taste-trawler/components/stale-items-panel.tsx
git commit -m "feat(dashboard): craft pass — skeletons, empty/error states, hover, tabular figures"
```

---

## Task 11: Craft pass — `/inventory`

**Files:**
- Modify: `taste-trawler/app/inventory/page.tsx`
- Modify: `taste-trawler/components/item-table.tsx`

- [ ] **Step 1: Read current files**

Note the data fetching path, the table column definitions, and whether pagination/filtering exists.

- [ ] **Step 2: Wrap page in `PageContainer` + `PageHeader`**

Edit `taste-trawler/app/inventory/page.tsx`:

```tsx
import { PageContainer, PageHeader } from '@/components/page-container';
// ... other imports

export default /* async? */ function InventoryPage() {
  // existing fetch
  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Everything listed, sold, and sitting. 127 rows — sortable."
      />
      {/* existing table */}
    </PageContainer>
  );
}
```

- [ ] **Step 3: Add `TableSkeleton` Suspense fallback**

If the page is async, wrap the `<ItemTable>` in `<Suspense fallback={<TableSkeleton rows={12} />}>...</Suspense>`. If data is passed in as a prop from a parent fetch, add a `loading` prop to `ItemTable` and render the skeleton in-place.

- [ ] **Step 4: Empty state in `ItemTable`**

Edit `taste-trawler/components/item-table.tsx`. Where it renders with zero rows, return:

```tsx
import { EmptyState } from '@/components/empty-state';

// inside render:
if (!items || items.length === 0) {
  return (
    <EmptyState
      title="Empty rails."
      description="No items match this filter yet. Add one from the bot, or change the status tab."
      illustration={<span aria-hidden>📦</span>}
    />
  );
}
```

- [ ] **Step 5: Tabular figures on money + numeric columns**

In `item-table.tsx`, locate the cells that render `buyPrice`, `listPrice`, `soldPrice`, `views`, `likes`. Apply to each:

```tsx
<td className="px-3 py-2 text-right font-mono text-sm [font-feature-settings:'tnum']">
  {formatPence(item.listPrice)}
</td>
```

Numbers right-aligned, text left-aligned. Ensure the `<th>` elements match their columns' alignment.

- [ ] **Step 6: Row hover + focus states**

On the `<tr>` rendering real data rows:

```tsx
className="group border-b border-border transition-colors hover:bg-accent/40 focus-within:bg-accent/40"
```

If rows have clickable actions, the clickable element gets its own `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

- [ ] **Step 7: Add `error.tsx` for the inventory segment**

Create `taste-trawler/app/inventory/error.tsx`:

```tsx
'use client';

import { RouteErrorFallback } from '@/components/error-state';

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} />;
}
```

- [ ] **Step 8: Manual verification**

Run: `cd taste-trawler && npm run dev`
Visit `/inventory`. Expected:
1. Container width matches dashboard.
2. Money columns are mono and do not jitter when scrolling.
3. Row hover shows a subtle accent tint.
4. Table tab-focusable rows show focus rings.
5. With zero items (filter to an unused status if possible) the empty state renders.
Stop the dev server.

- [ ] **Step 9: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/app/inventory/ taste-trawler/components/item-table.tsx
git commit -m "feat(inventory): craft pass — skeleton, empty state, tabular figures, row hover"
```

---

## Task 12: Craft pass — `/workbench`

**Files:**
- Modify: `taste-trawler/app/workbench/page.tsx`
- Modify: `taste-trawler/components/listing-editor.tsx`
- Modify: `taste-trawler/components/pricing-panel.tsx`
- Modify: `taste-trawler/components/photo-upload.tsx`

- [ ] **Step 1: Read the four files**

Note which are client components (likely all four), how they manage form state, and where loading/error feedback currently lives.

- [ ] **Step 2: Wrap `/workbench` page in `PageContainer` + `PageHeader`**

Same pattern as tasks 10/11.

```tsx
<PageContainer>
  <PageHeader
    title="Workbench"
    description="Draft, price, and photo-edit an item before it goes live."
  />
  {/* existing layout */}
</PageContainer>
```

- [ ] **Step 3: Focus-visible rings on every form input and button**

For each `<input>`, `<textarea>`, `<select>`, and `<button>` in all four files, ensure the className includes:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

If a form component is a shadcn primitive (`<Input>`, `<Textarea>`, `<Button>`), those already have focus rings via their base classes — leave them. Only add to raw HTML elements.

- [ ] **Step 4: Loading + error states in `photo-upload.tsx`**

During an in-flight upload, replace the upload button with a skeleton or a disabled state:

```tsx
{isUploading ? (
  <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary" />
    Uploading…
  </div>
) : (
  /* existing upload button */
)}
```

On upload error, render the `ErrorState` component inline beneath the upload zone with a `retry` callback that retries the failed file.

- [ ] **Step 5: Save button feedback in `listing-editor.tsx`**

When a save is in-flight, the save button shows a spinner and is `disabled`. On success, fire a Sonner toast (`toast.success(...)`) — Sonner is already installed.

```tsx
import { toast } from 'sonner';

// in the save handler:
try {
  await save();
  toast.success('Listing saved.');
} catch (err) {
  toast.error(err instanceof Error ? err.message : 'Save failed.');
}
```

Ensure a `<Toaster />` is mounted in the root layout. If it isn't, add it inside `<Providers>` in `components/providers.tsx`:

```tsx
import { Toaster } from 'sonner';
// ...
<ThemeProvider ...>
  {children}
  <Toaster richColors closeButton position="top-center" />
</ThemeProvider>
```

- [ ] **Step 6: Add `error.tsx` for the workbench segment**

Create `taste-trawler/app/workbench/error.tsx`:

```tsx
'use client';

import { RouteErrorFallback } from '@/components/error-state';

export default function WorkbenchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} />;
}
```

- [ ] **Step 7: Manual verification**

Run: `cd taste-trawler && npm run dev`
Visit `/workbench`. Expected:
1. Header matches the other two pages.
2. Every form element shows a focus ring on Tab.
3. Uploading a photo shows the uploading state, and on completion a toast fires.
4. Clicking Save on a listing fires a success toast.
5. Forced error (temporarily `throw new Error('test')`) shows the themed error card.
Stop the dev server.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/app/workbench/ taste-trawler/components/listing-editor.tsx taste-trawler/components/pricing-panel.tsx taste-trawler/components/photo-upload.tsx taste-trawler/components/providers.tsx
git commit -m "feat(workbench): craft pass — focus rings, upload states, save toasts, error boundary"
```

---

## Task 13: `docs/craft-review.md` checklist + final end-to-end verification

**Files:**
- Create: `taste-trawler/docs/craft-review.md`

- [ ] **Step 1: Create the checklist**

Create `taste-trawler/docs/craft-review.md`:

```markdown
# Craft Review Checklist

Run through this 12-point checklist before merging any PR that touches a user-facing surface. Every box must be ticked or explicitly waived in the PR description.

## The twelve points

1. **Skeleton** — every async surface has a content-shaped skeleton, not a spinner.
2. **Empty state** — every zero-data surface renders `<EmptyState>` with copy in MG's voice.
3. **Error state** — every route segment has an `error.tsx`, and inline failures use `<ErrorState>` or a themed toast.
4. **Success feedback** — destructive and mutating actions fire a Sonner toast on success.
5. **Type scale** — all text sizes use Tailwind `text-*` utilities backed by the tokens in `globals.css`. No `text-[17px]`.
6. **Spacing grid** — all paddings/gaps/margins are multiples of 4px. No `p-[13px]`.
7. **Alignment** — page content sits inside `<PageContainer>`; numeric columns are right-aligned and use `font-mono` with `[font-feature-settings:'tnum']`.
8. **Hover states** — every interactive element has a distinct hover that isn't the CSS default.
9. **Focus states** — every interactive element has `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or equivalent).
10. **Image treatment** — every user photo goes through `next/image` with a locked aspect ratio per surface.
11. **Responsive at three breakpoints** — sm (375), md (768), lg (1280). No horizontal scroll, no layout breakage.
12. **60fps on mid-phone** — scrolling and hover transitions do not drop frames on a 2-year-old Android (Chrome DevTools → Performance → CPU 4x slowdown as a proxy).

## When to waive

A waiver is acceptable if:
- The surface is behind a feature flag only James uses, or
- The craft work is explicitly scheduled in a later phase and the PR is a scaffolding commit.

Any other waiver requires a one-line justification in the PR description.
```

- [ ] **Step 2: Run the full app end-to-end against the checklist**

Run: `cd taste-trawler && npm run dev`
Visit every route:
- `/` (landing)
- `/sign-in`
- `/dashboard`
- `/inventory`
- `/workbench`

For each, walk through the 12 points. Expected result: **most points tick for `/dashboard`, `/inventory`, and `/workbench`**, and many tick for `/` and `/sign-in` (which see their full treatment in phase 2). Points that are explicitly phase-2/3 work (image treatment on hero photos, theme-specific motifs, mobile Sheet nav) can be waived with "phase 2/3 scope" in the commit message.

- [ ] **Step 3: Type-check + build**

Run: `cd taste-trawler && npx tsc --noEmit && npm run build`
Expected: type-check clean, build succeeds, no new warnings.

- [ ] **Step 4: Commit the checklist**

```bash
cd /c/Users/James/Desktop/Mgvinted
git add taste-trawler/docs/craft-review.md
git commit -m "docs: add 12-point craft review checklist"
```

- [ ] **Step 5: Final state report to James**

At this point the branch has roughly 13 new commits on top of `feat/phase1-mvp`. Report to James:
- Phase 1 complete, not pushed.
- Summary of what changed (tokens, fonts, schema, theme wiring, nav rebuild, three craft passes, checklist).
- Known phase-2/3 deferrals (final palette values, motif SVGs, display-font theatre beyond the nav wordmark, inventory gallery view, sparkle cursor, sale celebrations).
- Ready for James to review locally; push happens only on his go.

---

## Self-review — checking plan against spec

**1. Spec coverage:**

| Spec requirement (§ ref) | Covered by |
|---|---|
| Type + spacing + container tokens (§6.1) | Task 1 |
| Nav rebuild (§6.6) | Task 9 |
| Craft pass on `/dashboard` (§6) | Task 10 |
| Craft pass on `/inventory` (§6) | Task 11 |
| Craft pass on `/workbench` (§6) | Task 12 |
| Craft review checklist (§6.7) | Task 13 |
| `theme_settings` + `theme_history` tables (§7.2) | Task 3 |
| `lib/theme.ts` reader with `unstable_cache` + tag (§7.3) | Task 5 |
| next-themes wired with `malibu`/`leopard` (§7.3, corrected from spec §8.Phase 1 which listed `system`) | Task 6 |
| Pangram Pangram free fonts via `next/font/local` (§5.3, §8.Phase 1) | Task 2 |
| Shared dial schema (§7.1) — not strictly required until phase 4 but included here so bot integration is unblocked | Task 4 |
| Empty/error/loading states everywhere (§6.3) | Tasks 7, 8, 10, 11, 12 |

**Gaps:** none against the phase 1 exit criterion ("app still mostly monochrome but feels crafted"). Items deferred to later phases are explicit (motif SVGs, final palettes, gallery view, dial bot tool).

**2. Placeholder scan:** No "TBD", "TODO", "fill in details". Every code block contains the actual content. Every command has an expected output. ✓

**3. Type consistency:** `ThemeName`, `ThemeDials`, `MalibuDials`, `LeopardDials` defined in Task 4; used by Tasks 5 and 6. `dialsToCssBlock`/`allThemeCssBlocks` defined in Task 5, used in Task 6. `EmptyState`, `ErrorState`, `PageContainer`, `PageHeader` defined in Task 7, used in Tasks 10–12. `TableSkeleton`, `KpiSkeleton`, `CardGridSkeleton` defined in Task 8, used in Tasks 10 and 11. ✓

**4. Ambiguity:** The only judgement call left to the implementer is *which* Pangram Pangram font to download if the two named ones aren't free at pull time — Task 2 step 1 is explicit about substitution rules and commit-message disclosure.

Plan is ready for execution.
