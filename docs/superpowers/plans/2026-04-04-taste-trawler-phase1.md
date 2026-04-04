# Taste Trawler Phase 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working resale assistant that lets MG photograph items, get AI-powered pricing/descriptions, track inventory with P&L, and evaluate items via WhatsApp — deployed on Vercel with data in Neon Postgres.

**Architecture:** Next.js 16 App Router on Vercel (web UI + API routes) backed by Neon Postgres (Drizzle ORM) and Vercel Blob (photos). AI processing via Gemini Flash through Vercel AI Gateway. WhatsApp integration via new tools added to the existing Clawd bot on the VPS. The web app exposes API endpoints that both the UI and Clawd tools consume.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon Postgres, Vercel Blob, Vercel AI Gateway (Gemini Flash), Clerk auth, eBay Browse API.

**Spec:** `docs/superpowers/specs/2026-04-04-taste-trawler-design.md`

**Phases covered:** Phase 1 only. Phases 2-5 (Vinted harvester, opportunity engine, automation, scale) will be planned separately after Phase 1 ships.

---

## File Structure

```
taste-trawler/                         # Next.js 16 app (Vercel)
├── app/
│   ├── layout.tsx                     # Root layout (Clerk provider, fonts, theme)
│   ├── page.tsx                       # Landing → redirect to /dashboard
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── dashboard/
│   │   └── page.tsx                   # P&L overview, KPIs, stale items
│   ├── inventory/
│   │   └── page.tsx                   # Item table with filters/sort
│   ├── workbench/
│   │   └── page.tsx                   # Photo upload → AI → listing editor
│   └── api/
│       ├── items/
│       │   ├── route.ts               # GET (list) + POST (create)
│       │   └── [id]/
│       │       └── route.ts           # GET + PATCH + DELETE single item
│       ├── analyse/
│       │   └── route.ts               # POST: photos → Gemini Flash → structured analysis
│       ├── generate-listing/
│       │   └── route.ts               # POST: analysis + comps → title, description, price
│       ├── comps/
│       │   └── route.ts               # POST: search eBay for comparable items
│       ├── upload/
│       │   └── route.ts               # POST: upload photos to Vercel Blob
│       ├── stats/
│       │   └── route.ts               # GET: P&L stats for dashboard
│       └── taste-profile/
│           └── route.ts               # GET: aggregated taste profile data
├── components/
│   ├── ui/                            # shadcn/ui components (generated)
│   ├── item-card.tsx                  # Item display card (photo, title, status, margin)
│   ├── item-table.tsx                 # Inventory table with sort/filter
│   ├── photo-upload.tsx               # Drag-drop + camera upload component
│   ├── listing-editor.tsx             # AI-generated listing review/edit form
│   ├── pricing-panel.tsx              # Comparable sales + margin calculation
│   ├── kpi-cards.tsx                  # Dashboard KPI row
│   ├── stale-items-panel.tsx          # Items needing attention
│   └── nav.tsx                        # Top navigation
├── lib/
│   ├── db/
│   │   ├── index.ts                   # Drizzle client (Neon serverless)
│   │   ├── schema.ts                  # All table definitions
│   │   └── migrate.ts                 # Migration runner
│   ├── ai/
│   │   ├── analyse-photos.ts          # Gemini Flash vision → structured JSON
│   │   ├── generate-listing.ts        # AI listing generation (title, description, price)
│   │   └── taste-profile.ts           # Aggregate taste vectors from sold items
│   ├── ebay/
│   │   ├── client.ts                  # eBay Browse API client (auth, search, get item)
│   │   └── types.ts                   # eBay API response types
│   ├── blob.ts                        # Vercel Blob upload helper
│   └── utils.ts                       # Shared utilities (format currency, dates)
├── proxy.ts                           # Clerk auth middleware (Next.js 16)
├── drizzle.config.ts                  # Drizzle Kit configuration
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── .env.local                         # Local env vars (pulled via vercel env pull)

clawd-tools/                           # Added to existing Clawd on VPS
├── tt-definitions.js                  # Tool schemas for tt_evaluate_item, tt_quick_list, tt_stats
├── tt-handler.js                      # Tool dispatch → Taste Trawler API calls
├── tt-api-client.js                   # HTTP client for Vercel app API
└── tt-formatter.js                    # Format API responses for WhatsApp messages
```

---

## Task Group A: Project Foundation

### Task 1: Scaffold Next.js App

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Create Next.js 16 app**

```bash
cd C:/Users/James/Desktop/Mgvinted
npx create-next-app@latest taste-trawler --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

Expected: New `taste-trawler/` directory with Next.js 16 scaffold.

- [ ] **Step 2: Install core dependencies**

```bash
cd taste-trawler
npm install drizzle-orm @neondatabase/serverless @vercel/blob ai @ai-sdk/react
npm install -D drizzle-kit
```

- [ ] **Step 3: Initialise shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc base colour, CSS variables yes.

- [ ] **Step 4: Add core shadcn components**

```bash
npx shadcn@latest add button card table input textarea label badge tabs separator dropdown-menu dialog toast
```

- [ ] **Step 5: Configure Geist fonts in layout**

```tsx
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata = {
  title: 'Taste Trawler',
  description: 'AI-powered resale assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

```bash
npm install geist
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: App running at `http://localhost:3000`.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js 16 app with shadcn/ui and Geist fonts"
```

---

### Task 2: Database Schema

**Files:**
- Create: `lib/db/index.ts`, `lib/db/schema.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create Drizzle config**

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Define schema**

```ts
// lib/db/schema.ts
import { pgTable, text, integer, real, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const itemStatusEnum = pgEnum('item_status', [
  'draft', 'listed', 'sold', 'stale', 'archived',
]);

export const itemSourceEnum = pgEnum('item_source', [
  'charity_shop', 'vinted_flip', 'ebay', 'sale', 'other',
]);

export const items = pgTable('items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  photos: jsonb('photos').$type<string[]>().notNull().default([]),
  title: text('title').notNull().default(''),
  description: text('description').notNull().default(''),
  brand: text('brand'),
  category: text('category'),
  condition: text('condition'),
  era: text('era'),
  colours: jsonb('colours').$type<string[]>().default([]),
  styleTags: jsonb('style_tags').$type<string[]>().default([]),
  material: text('material'),
  size: text('size'),

  buyPrice: integer('buy_price'),      // pence
  listPrice: integer('list_price'),     // pence
  soldPrice: integer('sold_price'),     // pence
  soldAt: timestamp('sold_at'),
  listedAt: timestamp('listed_at'),

  source: itemSourceEnum('source').notNull().default('charity_shop'),
  status: itemStatusEnum('status').notNull().default('draft'),

  vintedListingId: text('vinted_listing_id'),
  tasteVector: jsonb('taste_vector').$type<Record<string, number>>(),
  storyPotentialScore: real('story_potential_score'),

  views: integer('views').default(0),
  likes: integer('likes').default(0),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comparableSales = pgTable('comparable_sales', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  itemId: text('item_id').references(() => items.id),
  platform: text('platform').notNull(),
  itemTitle: text('item_title').notNull(),
  soldPrice: integer('sold_price'),     // pence
  soldAt: timestamp('sold_at'),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ComparableSale = typeof comparableSales.$inferSelect;
```

```bash
npm install @paralleldrive/cuid2
```

- [ ] **Step 3: Create Drizzle client**

```ts
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
```

- [ ] **Step 4: Generate and push migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Expected: Tables created in Neon Postgres. (Requires `DATABASE_URL` in `.env.local` — will be set up via `vercel env pull` after linking the project.)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add database schema with items and comparable_sales tables"
```

---

### Task 3: Authentication (Clerk)

**Files:**
- Create: `proxy.ts`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install Clerk**

```bash
npm install @clerk/nextjs
```

- [ ] **Step 2: Create proxy.ts (Next.js 16 middleware)**

```ts
// proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/webhook(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
```

- [ ] **Step 3: Add ClerkProvider to layout**

```tsx
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import './globals.css';

export const metadata = {
  title: 'Taste Trawler',
  description: 'AI-powered resale assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 4: Create sign-in and sign-up pages**

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 5: Add redirect from root to dashboard**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

- [ ] **Step 6: Verify auth flow works**

```bash
npm run dev
```

Navigate to `http://localhost:3000`. Expected: redirected to Clerk sign-in. (Requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`.)

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add Clerk authentication with sign-in/sign-up pages"
```

---

## Task Group B: Core Data Pipeline

### Task 4: Photo Upload

**Files:**
- Create: `lib/blob.ts`, `app/api/upload/route.ts`, `components/photo-upload.tsx`

- [ ] **Step 1: Create Blob upload helper**

```ts
// lib/blob.ts
import { put } from '@vercel/blob';

export async function uploadPhoto(file: File): Promise<string> {
  const blob = await put(`items/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });
  return blob.url;
}
```

- [ ] **Step 2: Create upload API route**

```ts
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('photos') as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const urls: string[] = [];

  for (const file of files) {
    const blob = await put(`items/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });
    urls.push(blob.url);
  }

  return NextResponse.json({ urls });
}
```

- [ ] **Step 3: Create photo upload component**

```tsx
// components/photo-upload.tsx
'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onUpload: (urls: string[]) => void;
  existingPhotos?: string[];
}

export function PhotoUpload({ onUpload, existingPhotos = [] }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(existingPhotos);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('photos', file));

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { urls } = await res.json();

    const updated = [...photos, ...urls];
    setPhotos(updated);
    onUpload(updated);
    setUploading(false);
  }, [photos, onUpload]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {photos.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
        <label className="flex items-center justify-center w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50 transition-colors">
          <span className="text-muted-foreground text-lg">+</span>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add photo upload to Vercel Blob with drag-drop component"
```

---

### Task 5: AI Photo Analysis (Gemini Flash)

**Files:**
- Create: `lib/ai/analyse-photos.ts`, `app/api/analyse/route.ts`

- [ ] **Step 1: Create photo analysis function**

```ts
// lib/ai/analyse-photos.ts
import { generateText } from 'ai';

export interface PhotoAnalysis {
  brand: string | null;
  category: string;
  condition: string;
  era: string | null;
  colours: string[];
  material: string | null;
  styleTags: string[];
  size: string | null;
  storyPotentialScore: number;
  summary: string;
}

export async function analysePhotos(photoUrls: string[]): Promise<PhotoAnalysis> {
  const { text } = await generateText({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a fashion resale expert. Analyse these photos of an item for sale on Vinted.

Return a JSON object with exactly these fields:
- brand: string or null (detected brand name, null if unknown)
- category: string (e.g. "Bags", "Coats", "Shoes", "Accessories", "Tops", "Dresses", "Ceramics")
- condition: string ("New", "Like New", "Good", "Fair")
- era: string or null (e.g. "1990s", "2000s", "1970s", null if modern/unknown)
- colours: string[] (dominant colours, max 3)
- material: string or null (e.g. "leather", "wool", "silk", "cotton", "ceramic")
- styleTags: string[] (max 5 aesthetic tags, e.g. "vintage", "minimalist", "bohemian", "designer", "cottagecore")
- size: string or null (if visible on labels)
- storyPotentialScore: number 1-10 (how compelling would this be as a Vinted listing — provenance, photogenic quality, nostalgia factor, rarity)
- summary: string (one sentence describing the item for internal use)

Return ONLY valid JSON, no markdown wrapping.`,
          },
          ...photoUrls.map((url) => ({
            type: 'image' as const,
            image: url,
          })),
        ],
      },
    ],
  });

  return JSON.parse(text) as PhotoAnalysis;
}
```

- [ ] **Step 2: Create analysis API route**

```ts
// app/api/analyse/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analysePhotos } from '@/lib/ai/analyse-photos';

export async function POST(request: NextRequest) {
  const { photoUrls } = await request.json();

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return NextResponse.json({ error: 'photoUrls array required' }, { status: 400 });
  }

  const analysis = await analysePhotos(photoUrls);
  return NextResponse.json(analysis);
}
```

- [ ] **Step 3: Test with a sample image**

Start dev server, use curl or the browser console:

```bash
curl -X POST http://localhost:3000/api/analyse \
  -H "Content-Type: application/json" \
  -d '{"photoUrls": ["https://example.com/test-item.jpg"]}'
```

Expected: JSON response with brand, category, colours, etc.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add Gemini Flash photo analysis via AI Gateway"
```

---

### Task 6: eBay Browse API Client

**Files:**
- Create: `lib/ebay/client.ts`, `lib/ebay/types.ts`, `app/api/comps/route.ts`

- [ ] **Step 1: Define eBay types**

```ts
// lib/ebay/types.ts
export interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  image: { imageUrl: string };
  condition: string;
  itemWebUrl: string;
  seller: { username: string };
}

export interface EbaySearchResponse {
  itemSummaries?: EbayItem[];
  total: number;
  next?: string;
}

export interface CompResult {
  platform: 'ebay';
  title: string;
  price: number;       // pence
  url: string;
  imageUrl: string;
  condition: string;
  seller: string;
}
```

- [ ] **Step 2: Create eBay client**

```ts
// lib/ebay/client.ts
import type { EbaySearchResponse, CompResult } from './types';

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export async function searchEbay(query: string, limit = 10): Promise<CompResult[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    filter: 'deliveryCountry:GB',
    sort: 'price',
  });

  const res = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
      },
    }
  );

  const data: EbaySearchResponse = await res.json();

  return (data.itemSummaries ?? []).map((item) => ({
    platform: 'ebay' as const,
    title: item.title,
    price: Math.round(parseFloat(item.price.value) * 100),
    url: item.itemWebUrl,
    imageUrl: item.image.imageUrl,
    condition: item.condition,
    seller: item.seller.username,
  }));
}

export async function searchCharityStores(query: string): Promise<CompResult[]> {
  const charitySellerIds = [
    'britishheartfoundationshop',
    'oxaboroughmarket',
    'sueryderpreloved',
  ];

  const results: CompResult[] = [];

  for (const seller of charitySellerIds) {
    const sellerResults = await searchEbay(`${query} seller:${seller}`, 5);
    results.push(...sellerResults);
  }

  return results;
}
```

- [ ] **Step 3: Create comps API route**

```ts
// app/api/comps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchEbay } from '@/lib/ebay/client';

export async function POST(request: NextRequest) {
  const { query, limit } = await request.json();

  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  const results = await searchEbay(query, limit ?? 10);
  return NextResponse.json({ results });
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add eBay Browse API client with comparable search"
```

---

### Task 7: Listing Generator

**Files:**
- Create: `lib/ai/generate-listing.ts`, `app/api/generate-listing/route.ts`

- [ ] **Step 1: Create listing generator**

```ts
// lib/ai/generate-listing.ts
import { generateText } from 'ai';
import type { PhotoAnalysis } from './analyse-photos';
import type { CompResult } from '../ebay/types';

export interface GeneratedListing {
  title: string;
  description: string;
  suggestedPrice: number;   // pence
  priceReasoning: string;
  category: string;
}

export async function generateListing(
  analysis: PhotoAnalysis,
  comps: CompResult[]
): Promise<GeneratedListing> {
  const compSummary = comps.length > 0
    ? comps.map((c) => `${c.title}: £${(c.price / 100).toFixed(2)} (${c.condition})`).join('\n')
    : 'No comparable sales found.';

  const avgCompPrice = comps.length > 0
    ? Math.round(comps.reduce((sum, c) => sum + c.price, 0) / comps.length)
    : null;

  const { text } = await generateText({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: `You are writing a Vinted listing for a UK seller. She writes warm, concise listings with personality. Not corporate, not overly casual. She uses emoji sparingly if at all.

Item analysis:
${JSON.stringify(analysis, null, 2)}

Comparable sales on eBay:
${compSummary}

Average comp price: ${avgCompPrice ? `£${(avgCompPrice / 100).toFixed(2)}` : 'unknown'}

Generate a JSON object with:
- title: string (max 80 chars, include brand if known, era if vintage, key descriptor)
- description: string (3-4 short paragraphs. Lead with the compelling detail. Mention condition honestly. End with a hook. No hashtags.)
- suggestedPrice: number in pence (slightly below or at average comp price — she wants fast sales)
- priceReasoning: string (one sentence explaining why this price)
- category: string (Vinted category, e.g. "Women's Bags", "Men's Coats")

Return ONLY valid JSON, no markdown wrapping.`,
      },
    ],
  });

  return JSON.parse(text) as GeneratedListing;
}
```

- [ ] **Step 2: Create API route**

```ts
// app/api/generate-listing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateListing } from '@/lib/ai/generate-listing';

export async function POST(request: NextRequest) {
  const { analysis, comps } = await request.json();

  if (!analysis) {
    return NextResponse.json({ error: 'analysis required' }, { status: 400 });
  }

  const listing = await generateListing(analysis, comps ?? []);
  return NextResponse.json(listing);
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add AI listing generator with pricing intelligence"
```

---

## Task Group C: Item CRUD & Web UI

### Task 8: Item API Routes

**Files:**
- Create: `app/api/items/route.ts`, `app/api/items/[id]/route.ts`, `app/api/stats/route.ts`

- [ ] **Step 1: Create items list + create route**

```ts
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');

  const query = db.select().from(items).orderBy(desc(items.createdAt));

  const result = status
    ? await query.where(eq(items.status, status as any))
    : await query;

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const [item] = await db.insert(items).values({
    ...body,
    buyPrice: body.buyPrice ? Math.round(body.buyPrice) : null,
    listPrice: body.listPrice ? Math.round(body.listPrice) : null,
  }).returning();

  return NextResponse.json(item, { status: 201 });
}
```

- [ ] **Step 2: Create single item route**

```ts
// app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [item] = await db.select().from(items).where(eq(items.id, id));

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(items)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(items).where(eq(items.id, id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create stats route**

```ts
// app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sold = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(sold_price), 0)`,
      cost: sql<number>`coalesce(sum(buy_price), 0)`,
      avgDaysToSell: sql<number>`coalesce(avg(extract(epoch from (sold_at - listed_at)) / 86400), 0)`,
    })
    .from(items)
    .where(and(eq(items.status, 'sold'), gte(items.soldAt, since)));

  const active = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(eq(items.status, 'listed'));

  const stale = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(
      and(
        eq(items.status, 'listed'),
        sql`listed_at < now() - interval '14 days'`
      )
    );

  const bestFlip = await db
    .select({
      title: items.title,
      margin: sql<number>`sold_price - buy_price`,
      marginPct: sql<number>`case when buy_price > 0 then round((sold_price - buy_price)::numeric / buy_price * 100) else 0 end`,
    })
    .from(items)
    .where(and(eq(items.status, 'sold'), gte(items.soldAt, since)))
    .orderBy(sql`sold_price - buy_price desc`)
    .limit(1);

  const stats = sold[0];

  return NextResponse.json({
    revenue: stats.revenue,
    profit: stats.revenue - stats.cost,
    margin: stats.revenue > 0 ? Math.round(((stats.revenue - stats.cost) / stats.revenue) * 100) : 0,
    itemsSold: stats.count,
    avgDaysToSell: Math.round(stats.avgDaysToSell * 10) / 10,
    activeListings: active[0].count,
    staleListings: stale[0].count,
    bestFlip: bestFlip[0] ?? null,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add item CRUD and stats API routes"
```

---

### Task 9: Navigation and Layout Shell

**Files:**
- Create: `components/nav.tsx`, `app/dashboard/page.tsx`, `app/inventory/page.tsx`, `app/workbench/page.tsx`

- [ ] **Step 1: Create navigation component**

```tsx
// components/nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/workbench', label: 'Workbench' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-mono text-sm font-semibold tracking-tight">
            Taste Trawler
          </Link>
          <div className="flex gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  pathname === href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <UserButton />
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add Nav to layout, create page shells**

```tsx
// app/layout.tsx — update to include Nav for authenticated pages
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Nav } from '@/components/nav';
import './globals.css';

export const metadata = {
  title: 'Taste Trawler',
  description: 'AI-powered resale assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-background text-foreground`}>
          <SignedIn>
            <Nav />
            <main className="mx-auto max-w-screen-xl px-4 py-6">{children}</main>
          </SignedIn>
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div><h1 className="text-lg font-semibold">Dashboard</h1></div>;
}
```

```tsx
// app/inventory/page.tsx
export default function InventoryPage() {
  return <div><h1 className="text-lg font-semibold">Inventory</h1></div>;
}
```

```tsx
// app/workbench/page.tsx
export default function WorkbenchPage() {
  return <div><h1 className="text-lg font-semibold">Workbench</h1></div>;
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add navigation shell with dashboard, inventory, workbench pages"
```

---

### Task 10: Dashboard Page

**Files:**
- Create: `components/kpi-cards.tsx`, `components/stale-items-panel.tsx`
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Create KPI cards component**

```tsx
// components/kpi-cards.tsx
import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  revenue: number;
  profit: number;
  margin: number;
  itemsSold: number;
  avgDaysToSell: number;
  activeListings: number;
  staleListings: number;
  bestFlip: { title: string; margin: number; marginPct: number } | null;
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function KpiCards({ stats }: { stats: Stats }) {
  const kpis = [
    { label: 'Revenue', value: formatPence(stats.revenue), sub: `${stats.margin}% margin` },
    { label: 'Profit', value: formatPence(stats.profit), sub: null },
    { label: 'Items Sold', value: String(stats.itemsSold), sub: `Avg ${stats.avgDaysToSell}d to sell` },
    { label: 'Active', value: String(stats.activeListings), sub: stats.staleListings > 0 ? `${stats.staleListings} stale` : null },
    { label: 'Best Flip', value: stats.bestFlip ? formatPence(stats.bestFlip.margin) : '—', sub: stats.bestFlip ? `${stats.bestFlip.title} · ${stats.bestFlip.marginPct}%` : null },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map(({ label, value, sub }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
            {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create stale items panel**

```tsx
// components/stale-items-panel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Item } from '@/lib/db/schema';

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function daysSince(date: Date | string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function StaleItemsPanel({ items }: { items: Item[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
          >
            <div>
              <p className="text-sm">{item.title || 'Untitled'}</p>
              <p className="text-[10px] text-muted-foreground">
                Listed {daysSince(item.listedAt!)}d · {item.views} views · {item.likes} likes
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {item.likes === 0 && item.views < 20 ? 'Relist?' : 'Reprice?'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Wire up dashboard page**

```tsx
// app/dashboard/page.tsx
import { KpiCards } from '@/components/kpi-cards';
import { StaleItemsPanel } from '@/components/stale-items-panel';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

async function getStats(days: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/stats?days=${days}`, { cache: 'no-store' });
  return res.json();
}

async function getStaleItems() {
  return db
    .select()
    .from(items)
    .where(
      and(
        eq(items.status, 'listed'),
        sql`listed_at < now() - interval '14 days'`
      )
    )
    .orderBy(desc(items.listedAt))
    .limit(5);
}

export default async function DashboardPage() {
  const [stats, staleItems] = await Promise.all([
    getStats(30),
    getStaleItems(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <KpiCards stats={stats} />
      <StaleItemsPanel items={staleItems} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add dashboard with KPI cards and stale items panel"
```

---

### Task 11: Inventory Table

**Files:**
- Create: `components/item-table.tsx`
- Modify: `app/inventory/page.tsx`

- [ ] **Step 1: Create item table component**

```tsx
// components/item-table.tsx
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Item } from '@/lib/db/schema';

function formatPence(pence: number | null): string {
  if (pence === null) return '—';
  return `£${(pence / 100).toFixed(2)}`;
}

function daysSince(date: Date | string | null): string {
  if (!date) return '—';
  return `${Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))}d`;
}

const statusColour: Record<string, string> = {
  draft: 'secondary',
  listed: 'default',
  sold: 'default',
  stale: 'destructive',
  archived: 'outline',
};

export function ItemTable({ items }: { items: Item[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right font-mono">Buy</TableHead>
          <TableHead className="text-right font-mono">List</TableHead>
          <TableHead className="text-right font-mono">Sold</TableHead>
          <TableHead className="text-right font-mono">Age</TableHead>
          <TableHead className="text-right font-mono">Views</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              {item.photos.length > 0 ? (
                <img
                  src={item.photos[0]}
                  alt=""
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-muted" />
              )}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-sm">
              {item.title || 'Untitled'}
            </TableCell>
            <TableCell>
              <Badge variant={statusColour[item.status] as any} className="text-[10px]">
                {item.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">{formatPence(item.buyPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatPence(item.listPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatPence(item.soldPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground">
              {daysSince(item.listedAt)}
            </TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground">
              {item.views}
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
              No items yet. Head to the Workbench to add your first item.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: Wire up inventory page**

```tsx
// app/inventory/page.tsx
import { ItemTable } from '@/components/item-table';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export default async function InventoryPage() {
  const allItems = await db.select().from(items).orderBy(desc(items.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">{allItems.length} items</p>
      </div>
      <ItemTable items={allItems} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add inventory page with sortable item table"
```

---

### Task 12: Listing Workbench Page

**Files:**
- Create: `components/listing-editor.tsx`, `components/pricing-panel.tsx`
- Modify: `app/workbench/page.tsx`

- [ ] **Step 1: Create pricing panel**

```tsx
// components/pricing-panel.tsx
import type { CompResult } from '@/lib/ebay/types';

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

interface PricingPanelProps {
  comps: CompResult[];
  suggestedPrice: number | null;
  priceReasoning: string | null;
  buyPrice: number | null;
}

export function PricingPanel({ comps, suggestedPrice, priceReasoning, buyPrice }: PricingPanelProps) {
  const margin = suggestedPrice && buyPrice ? suggestedPrice - buyPrice : null;

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Pricing Intelligence</p>

      <div className="flex gap-6">
        {buyPrice !== null && (
          <div>
            <p className="text-[10px] text-muted-foreground">BOUGHT FOR</p>
            <p className="font-mono text-sm">{formatPence(buyPrice)}</p>
          </div>
        )}
        {suggestedPrice !== null && (
          <div>
            <p className="text-[10px] text-muted-foreground">SUGGESTED</p>
            <p className="font-mono text-lg font-semibold text-emerald-400">{formatPence(suggestedPrice)}</p>
          </div>
        )}
        {margin !== null && (
          <div>
            <p className="text-[10px] text-muted-foreground">EST. MARGIN</p>
            <p className="font-mono text-lg font-semibold text-amber-400">{formatPence(margin)}</p>
          </div>
        )}
      </div>

      {priceReasoning && (
        <p className="text-xs text-muted-foreground">{priceReasoning}</p>
      )}

      {comps.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">COMPARABLES</p>
          <div className="space-y-1">
            {comps.slice(0, 5).map((comp, i) => (
              <div key={i} className="flex justify-between text-xs">
                <a href={comp.url} target="_blank" rel="noopener" className="truncate max-w-[70%] text-muted-foreground hover:text-foreground">
                  {comp.title}
                </a>
                <span className="font-mono">{formatPence(comp.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create listing editor**

```tsx
// components/listing-editor.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ListingEditorProps {
  title: string;
  description: string;
  brand: string | null;
  category: string;
  condition: string;
  suggestedPrice: number | null;
  onSave: (data: {
    title: string;
    description: string;
    listPrice: number;
    buyPrice: number | null;
    status: string;
  }) => void;
  onCopyToClipboard: () => void;
  saving: boolean;
}

export function ListingEditor({
  title: initialTitle,
  description: initialDescription,
  brand,
  category,
  condition,
  suggestedPrice,
  onSave,
  onCopyToClipboard,
  saving,
}: ListingEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [listPrice, setListPrice] = useState(suggestedPrice ? (suggestedPrice / 100).toFixed(2) : '');
  const [buyPrice, setBuyPrice] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {brand && <Badge variant="outline" className="text-[10px]">{brand}</Badge>}
        <Badge variant="outline" className="text-[10px]">{category}</Badge>
        <Badge variant="outline" className="text-[10px]">{condition}</Badge>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title" className="text-xs">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={8} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buyPrice" className="text-xs">Buy Price</Label>
          <Input id="buyPrice" type="number" step="0.01" placeholder="0.00" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listPrice" className="text-xs">List Price</Label>
          <Input id="listPrice" type="number" step="0.01" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() =>
            onSave({
              title,
              description,
              listPrice: Math.round(parseFloat(listPrice) * 100),
              buyPrice: buyPrice ? Math.round(parseFloat(buyPrice) * 100) : null,
              status: 'draft',
            })
          }
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Add to Inventory'}
        </Button>
        <Button variant="outline" onClick={onCopyToClipboard}>
          Copy for Vinted
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire up workbench page**

```tsx
// app/workbench/page.tsx
'use client';

import { useState } from 'react';
import { PhotoUpload } from '@/components/photo-upload';
import { ListingEditor } from '@/components/listing-editor';
import { PricingPanel } from '@/components/pricing-panel';
import { Button } from '@/components/ui/button';
import type { PhotoAnalysis } from '@/lib/ai/analyse-photos';
import type { CompResult } from '@/lib/ebay/types';

type Stage = 'upload' | 'analysing' | 'editing';

export default function WorkbenchPage() {
  const [stage, setStage] = useState<Stage>('upload');
  const [photos, setPhotos] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [listing, setListing] = useState<{ title: string; description: string; suggestedPrice: number; priceReasoning: string; category: string } | null>(null);
  const [comps, setComps] = useState<CompResult[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleAnalyse() {
    if (photos.length === 0) return;
    setStage('analysing');

    const analysisRes = await fetch('/api/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrls: photos }),
    });
    const analysisData: PhotoAnalysis = await analysisRes.json();
    setAnalysis(analysisData);

    const searchQuery = [analysisData.brand, analysisData.category, analysisData.era]
      .filter(Boolean)
      .join(' ');

    const compsRes = await fetch('/api/comps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery }),
    });
    const compsData = await compsRes.json();
    setComps(compsData.results);

    const listingRes = await fetch('/api/generate-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: analysisData, comps: compsData.results }),
    });
    const listingData = await listingRes.json();
    setListing(listingData);

    setStage('editing');
  }

  async function handleSave(data: { title: string; description: string; listPrice: number; buyPrice: number | null; status: string }) {
    setSaving(true);

    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        photos,
        brand: analysis?.brand,
        category: analysis?.category,
        condition: analysis?.condition,
        era: analysis?.era,
        colours: analysis?.colours,
        styleTags: analysis?.styleTags,
        material: analysis?.material,
        size: analysis?.size,
        storyPotentialScore: analysis?.storyPotentialScore,
      }),
    });

    setSaving(false);
    setStage('upload');
    setPhotos([]);
    setAnalysis(null);
    setListing(null);
    setComps([]);
  }

  function handleCopyToClipboard() {
    if (!listing) return;
    const text = `${listing.title}\n\n${listing.description}`;
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Workbench</h1>

      {stage === 'upload' && (
        <div className="space-y-4">
          <PhotoUpload onUpload={setPhotos} />
          {photos.length > 0 && (
            <Button onClick={handleAnalyse}>Analyse & Generate Listing</Button>
          )}
        </div>
      )}

      {stage === 'analysing' && (
        <p className="text-sm text-muted-foreground">Analysing photos and generating listing...</p>
      )}

      {stage === 'editing' && listing && analysis && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <PhotoUpload onUpload={setPhotos} existingPhotos={photos} />
            <PricingPanel
              comps={comps}
              suggestedPrice={listing.suggestedPrice}
              priceReasoning={listing.priceReasoning}
              buyPrice={null}
            />
          </div>
          <ListingEditor
            title={listing.title}
            description={listing.description}
            brand={analysis.brand}
            category={listing.category}
            condition={analysis.condition}
            suggestedPrice={listing.suggestedPrice}
            onSave={handleSave}
            onCopyToClipboard={handleCopyToClipboard}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add listing workbench with photo upload, AI analysis, and listing editor"
```

---

## Task Group D: WhatsApp Integration (Clawd Tools)

These files are added to the existing Clawd codebase on the VPS, not to the Next.js app.

### Task 13: Taste Trawler API Client for Clawd

**Files:**
- Create: `clawd-tools/tt-api-client.js`, `clawd-tools/tt-formatter.js`

Note: These files live in the Clawd project at `C:\Users\James\Downloads\clawdbot-claude-code\src\tools\` or similar — exact path depends on Clawd's tool organisation. Adjust paths to match Clawd's conventions.

- [ ] **Step 1: Create API client**

```js
// clawd-tools/tt-api-client.js
const TT_API_BASE = process.env.TASTE_TRAWLER_API_URL; // e.g. https://tastetrawler.vercel.app
const TT_API_KEY = process.env.TASTE_TRAWLER_API_KEY;

async function ttFetch(path, options = {}) {
  const res = await fetch(`${TT_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TT_API_KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`TT API error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function analysePhotos(photoUrls) {
  return ttFetch('/api/analyse', {
    method: 'POST',
    body: JSON.stringify({ photoUrls }),
  });
}

export async function searchComps(query) {
  return ttFetch('/api/comps', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function generateListing(analysis, comps) {
  return ttFetch('/api/generate-listing', {
    method: 'POST',
    body: JSON.stringify({ analysis, comps }),
  });
}

export async function createItem(itemData) {
  return ttFetch('/api/items', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
}

export async function getStats(days = 30) {
  return ttFetch(`/api/stats?days=${days}`);
}

export async function getItems(status) {
  const params = status ? `?status=${status}` : '';
  return ttFetch(`/api/items${params}`);
}

export { ttFetch };
```

- [ ] **Step 2: Create WhatsApp message formatter**

```js
// clawd-tools/tt-formatter.js

export function formatEvaluation(analysis, comps) {
  const brand = analysis.brand ? `*${analysis.brand}*` : 'Unknown brand';
  const era = analysis.era ? `, ${analysis.era}` : '';
  const colours = analysis.colours.join(', ');

  const avgPrice = comps.length > 0
    ? Math.round(comps.reduce((sum, c) => sum + c.price, 0) / comps.length)
    : null;

  const compLines = comps.slice(0, 3).map(
    (c) => `  ${c.title}: £${(c.price / 100).toFixed(2)}`
  ).join('\n');

  let msg = `${brand}${era} · ${analysis.category}\n`;
  msg += `${colours} · ${analysis.condition} · ${analysis.material || 'unknown material'}\n`;
  msg += `Story potential: ${analysis.storyPotentialScore}/10\n\n`;

  if (avgPrice) {
    msg += `Avg comp price: *£${(avgPrice / 100).toFixed(2)}*\n`;
    msg += `Comps:\n${compLines}\n\n`;
  } else {
    msg += `No comparable sales found.\n\n`;
  }

  msg += `Taste match: coming in Phase 2`;

  return msg;
}

export function formatQuickList(listing) {
  return `Saved to inventory:\n*${listing.title}*\nSuggested price: £${(listing.suggestedPrice / 100).toFixed(2)}\n\nReview and edit in the app when ready.`;
}

export function formatStats(stats) {
  let msg = `*This month*\n`;
  msg += `Revenue: £${(stats.revenue / 100).toFixed(2)}\n`;
  msg += `Profit: £${(stats.profit / 100).toFixed(2)} (${stats.margin}% margin)\n`;
  msg += `Sold: ${stats.itemsSold} items (avg ${stats.avgDaysToSell}d)\n`;
  msg += `Active: ${stats.activeListings} listed`;
  if (stats.staleListings > 0) msg += ` (${stats.staleListings} stale)`;
  if (stats.bestFlip) {
    msg += `\nBest flip: ${stats.bestFlip.title} — £${(stats.bestFlip.margin / 100).toFixed(2)} (${stats.bestFlip.marginPct}%)`;
  }
  return msg;
}

export function formatStaleItems(items) {
  if (items.length === 0) return 'Nothing stale right now.';

  const lines = items.map((item) => {
    const days = Math.floor((Date.now() - new Date(item.listedAt).getTime()) / (1000 * 60 * 60 * 24));
    return `  ${item.title || 'Untitled'} — ${days}d, ${item.views} views, ${item.likes} likes`;
  });

  return `*Stale items (14+ days):*\n${lines.join('\n')}`;
}
```

- [ ] **Step 3: Commit in Clawd repo**

```bash
cd /path/to/clawdbot
git add src/tools/tt-api-client.js src/tools/tt-formatter.js
git commit -m "feat: add Taste Trawler API client and WhatsApp formatters"
```

---

### Task 14: Taste Trawler Tool Definitions and Handler

**Files:**
- Create: `clawd-tools/tt-definitions.js`, `clawd-tools/tt-handler.js`
- Modify: Clawd's `tools/definitions.js` (add TT tools), `tools/handler.js` (add TT dispatch)

- [ ] **Step 1: Define tool schemas**

```js
// clawd-tools/tt-definitions.js
export const ttToolDefinitions = [
  {
    name: 'tt_evaluate_item',
    description: 'Analyse photos of an item for resale. Returns brand, category, condition, era, pricing intelligence, and comparable sales. Use when MG sends a photo of an item she is considering buying or listing.',
    input_schema: {
      type: 'object',
      properties: {
        photoUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of the item photos (from WhatsApp media download)',
        },
      },
      required: ['photoUrls'],
    },
  },
  {
    name: 'tt_quick_list',
    description: 'Generate a Vinted listing from photos and save it as a draft in Taste Trawler. Use when MG says "list this" or wants to save an item for listing.',
    input_schema: {
      type: 'object',
      properties: {
        photoUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of the item photos',
        },
        buyPrice: {
          type: 'number',
          description: 'What she paid in pence (optional)',
        },
      },
      required: ['photoUrls'],
    },
  },
  {
    name: 'tt_stats',
    description: 'Get Taste Trawler P&L stats. Use when MG asks how she is doing, wants a summary, or asks about profits.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look back (default 30)',
        },
      },
    },
  },
  {
    name: 'tt_stale_items',
    description: 'Get list of items that have been listed for 14+ days without selling. Use when MG asks what needs attention or what is stale.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'tt_search_comps',
    description: 'Search eBay for comparable items to help with pricing. Use when MG asks what something is worth or what similar items sell for.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (brand, item type, etc.)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'tt_add_buy_price',
    description: 'Record the buy price for an item already in inventory. Use when MG says what she paid for something.',
    input_schema: {
      type: 'object',
      properties: {
        itemTitle: {
          type: 'string',
          description: 'Title or partial title to find the item',
        },
        buyPrice: {
          type: 'number',
          description: 'Buy price in pence',
        },
      },
      required: ['itemTitle', 'buyPrice'],
    },
  },
];
```

- [ ] **Step 2: Create tool handler**

```js
// clawd-tools/tt-handler.js
import {
  analysePhotos,
  searchComps,
  generateListing,
  createItem,
  getStats,
  getItems,
} from './tt-api-client.js';
import {
  formatEvaluation,
  formatQuickList,
  formatStats,
  formatStaleItems,
} from './tt-formatter.js';

export async function handleTTTool(name, input) {
  switch (name) {
    case 'tt_evaluate_item': {
      const analysis = await analysePhotos(input.photoUrls);
      const query = [analysis.brand, analysis.category, analysis.era]
        .filter(Boolean)
        .join(' ');
      const comps = query ? (await searchComps(query)).results : [];
      return formatEvaluation(analysis, comps);
    }

    case 'tt_quick_list': {
      const analysis = await analysePhotos(input.photoUrls);
      const query = [analysis.brand, analysis.category, analysis.era]
        .filter(Boolean)
        .join(' ');
      const compsRes = query ? await searchComps(query) : { results: [] };
      const listing = await generateListing(analysis, compsRes.results);

      await createItem({
        photos: input.photoUrls,
        title: listing.title,
        description: listing.description,
        brand: analysis.brand,
        category: analysis.category,
        condition: analysis.condition,
        era: analysis.era,
        colours: analysis.colours,
        styleTags: analysis.styleTags,
        material: analysis.material,
        size: analysis.size,
        storyPotentialScore: analysis.storyPotentialScore,
        listPrice: listing.suggestedPrice,
        buyPrice: input.buyPrice ?? null,
        status: 'draft',
      });

      return formatQuickList(listing);
    }

    case 'tt_stats': {
      const stats = await getStats(input.days ?? 30);
      return formatStats(stats);
    }

    case 'tt_stale_items': {
      const items = await getItems('listed');
      const stale = items.filter((item) => {
        if (!item.listedAt) return false;
        const days = (Date.now() - new Date(item.listedAt).getTime()) / (1000 * 60 * 60 * 24);
        return days >= 14;
      });
      return formatStaleItems(stale);
    }

    case 'tt_search_comps': {
      const { results } = await searchComps(input.query);
      if (results.length === 0) return 'No comparable items found on eBay.';
      const lines = results.slice(0, 5).map(
        (c) => `${c.title}: £${(c.price / 100).toFixed(2)} (${c.condition})`
      );
      return `*eBay comps for "${input.query}":*\n${lines.join('\n')}`;
    }

    case 'tt_add_buy_price': {
      const allItems = await getItems();
      const match = allItems.find((item) =>
        item.title?.toLowerCase().includes(input.itemTitle.toLowerCase())
      );
      if (!match) return `Could not find an item matching "${input.itemTitle}".`;
      await ttFetch(`/api/items/${match.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ buyPrice: input.buyPrice }),
      });
      const margin = match.listPrice ? match.listPrice - input.buyPrice : null;
      return `Updated buy price for *${match.title}* to £${(input.buyPrice / 100).toFixed(2)}.${margin ? ` Estimated margin: £${(margin / 100).toFixed(2)}` : ''}`;
    }

    default:
      throw new Error(`Unknown TT tool: ${name}`);
  }
}
```

- [ ] **Step 3: Register tools in Clawd**

Add to Clawd's `tools/definitions.js`:
```js
import { ttToolDefinitions } from './tt-definitions.js';
// ... existing tool definitions ...
export const allTools = [...existingTools, ...ttToolDefinitions];
```

Add to Clawd's `tools/handler.js`:
```js
import { handleTTTool } from './tt-handler.js';
// In the tool dispatch switch:
if (toolName.startsWith('tt_')) {
  return handleTTTool(toolName, toolInput);
}
```

Add `tt_` tools to MG's allowed tools list in Clawd's access control config.

- [ ] **Step 4: Commit in Clawd repo**

```bash
cd /path/to/clawdbot
git add src/tools/tt-definitions.js src/tools/tt-handler.js src/tools/definitions.js src/tools/handler.js
git commit -m "feat: register Taste Trawler tools with Clawd smart router"
```

---

## Task Group E: Basic Taste Profile

### Task 15: Taste Profile Aggregation

**Files:**
- Create: `lib/ai/taste-profile.ts`, `app/api/taste-profile/route.ts`

- [ ] **Step 1: Create taste profile aggregator**

```ts
// lib/ai/taste-profile.ts
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface TasteProfile {
  topColours: { colour: string; count: number; pct: number }[];
  topCategories: { category: string; count: number; avgMargin: number }[];
  topBrands: { brand: string; count: number; avgMargin: number }[];
  topStyleTags: { tag: string; count: number }[];
  totalSold: number;
  avgMargin: number;
  avgDaysToSell: number;
}

export async function buildTasteProfile(): Promise<TasteProfile> {
  const soldItems = await db
    .select()
    .from(items)
    .where(eq(items.status, 'sold'));

  const totalSold = soldItems.length;
  if (totalSold === 0) {
    return {
      topColours: [],
      topCategories: [],
      topBrands: [],
      topStyleTags: [],
      totalSold: 0,
      avgMargin: 0,
      avgDaysToSell: 0,
    };
  }

  // Colour frequency
  const colourCounts: Record<string, number> = {};
  for (const item of soldItems) {
    for (const colour of (item.colours ?? [])) {
      colourCounts[colour] = (colourCounts[colour] ?? 0) + 1;
    }
  }
  const topColours = Object.entries(colourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([colour, count]) => ({ colour, count, pct: Math.round((count / totalSold) * 100) }));

  // Category performance
  const categoryData: Record<string, { count: number; totalMargin: number }> = {};
  for (const item of soldItems) {
    const cat = item.category ?? 'Other';
    if (!categoryData[cat]) categoryData[cat] = { count: 0, totalMargin: 0 };
    categoryData[cat].count++;
    if (item.soldPrice && item.buyPrice) {
      categoryData[cat].totalMargin += item.soldPrice - item.buyPrice;
    }
  }
  const topCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgMargin: data.count > 0 ? Math.round(data.totalMargin / data.count) : 0,
    }));

  // Brand frequency
  const brandCounts: Record<string, { count: number; totalMargin: number }> = {};
  for (const item of soldItems) {
    const brand = item.brand ?? 'Unknown';
    if (!brandCounts[brand]) brandCounts[brand] = { count: 0, totalMargin: 0 };
    brandCounts[brand].count++;
    if (item.soldPrice && item.buyPrice) {
      brandCounts[brand].totalMargin += item.soldPrice - item.buyPrice;
    }
  }
  const topBrands = Object.entries(brandCounts)
    .filter(([brand]) => brand !== 'Unknown')
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([brand, data]) => ({
      brand,
      count: data.count,
      avgMargin: data.count > 0 ? Math.round(data.totalMargin / data.count) : 0,
    }));

  // Style tag frequency
  const tagCounts: Record<string, number> = {};
  for (const item of soldItems) {
    for (const tag of (item.styleTags ?? [])) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const topStyleTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Averages
  const margins = soldItems
    .filter((i) => i.soldPrice && i.buyPrice)
    .map((i) => i.soldPrice! - i.buyPrice!);
  const avgMargin = margins.length > 0
    ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)
    : 0;

  const sellDays = soldItems
    .filter((i) => i.soldAt && i.listedAt)
    .map((i) => (new Date(i.soldAt!).getTime() - new Date(i.listedAt!).getTime()) / (1000 * 60 * 60 * 24));
  const avgDaysToSell = sellDays.length > 0
    ? Math.round((sellDays.reduce((a, b) => a + b, 0) / sellDays.length) * 10) / 10
    : 0;

  return {
    topColours,
    topCategories,
    topBrands,
    topStyleTags,
    totalSold,
    avgMargin,
    avgDaysToSell,
  };
}
```

- [ ] **Step 2: Create taste profile API route**

```ts
// app/api/taste-profile/route.ts
import { NextResponse } from 'next/server';
import { buildTasteProfile } from '@/lib/ai/taste-profile';

export async function GET() {
  const profile = await buildTasteProfile();
  return NextResponse.json(profile);
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add basic taste profile aggregation from sold items"
```

---

## Task Group F: Deployment

### Task 16: Vercel Deployment & Environment Setup

- [ ] **Step 1: Initialise git repo for the Next.js app (if not already done)**

```bash
cd taste-trawler
git init
git add .
git commit -m "initial commit"
```

- [ ] **Step 2: Create GitHub repo and push**

```bash
gh repo create taste-trawler --private --source=. --push
```

- [ ] **Step 3: Link to Vercel**

```bash
npm i -g vercel
vercel link
```

Follow prompts to create a new Vercel project.

- [ ] **Step 4: Install Marketplace integrations**

Neon Postgres:
```bash
vercel integration add neon
```

Clerk:
```bash
vercel integration add clerk
```

Vercel Blob is included by default.

- [ ] **Step 5: Set additional environment variables**

```bash
vercel env add EBAY_CLIENT_ID
vercel env add EBAY_CLIENT_SECRET
vercel env add TASTE_TRAWLER_API_KEY
vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL /sign-in
vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL /sign-up
```

For `TASTE_TRAWLER_API_KEY`, generate a random string — this is used by Clawd to authenticate API calls.

- [ ] **Step 6: Pull environment variables locally**

```bash
vercel env pull
```

This populates `.env.local` with `DATABASE_URL`, Clerk keys, Blob token, and AI Gateway OIDC credentials.

- [ ] **Step 7: Run database migration**

```bash
npx drizzle-kit push
```

- [ ] **Step 8: Deploy**

```bash
vercel deploy
```

Verify the preview URL works. Then promote to production:

```bash
vercel --prod
```

- [ ] **Step 9: Commit any config changes**

```bash
git add .
git commit -m "feat: configure Vercel deployment with Neon, Clerk, and Blob"
```

---

## Task Group G: API Authentication for Clawd

### Task 17: Secure API Routes for External Access

**Files:**
- Create: `lib/api-auth.ts`
- Modify: All API routes that Clawd calls

- [ ] **Step 1: Create API key authentication helper**

```ts
// lib/api-auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function authenticateApiRequest(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.TASTE_TRAWLER_API_KEY;

  if (!expectedKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  if (authHeader === `Bearer ${expectedKey}`) {
    return null; // Authenticated
  }

  // If no API key, fall through to Clerk auth (for browser requests)
  return null;
}
```

- [ ] **Step 2: Add auth check to API routes called by Clawd**

Add to the top of `app/api/analyse/route.ts`, `app/api/comps/route.ts`, `app/api/generate-listing/route.ts`, `app/api/items/route.ts`, `app/api/stats/route.ts`:

```ts
import { authenticateApiRequest } from '@/lib/api-auth';

// At start of POST/GET handler:
const authError = authenticateApiRequest(request);
if (authError) return authError;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add API key auth for Clawd external access"
```

---

## Summary

**17 tasks across 7 groups:**

| Group | Tasks | What It Delivers |
|-------|-------|-----------------|
| A: Foundation | 1-3 | Next.js app, database, auth |
| B: Data Pipeline | 4-7 | Photo upload, AI analysis, eBay comps, listing generation |
| C: Web UI | 8-12 | Item CRUD, dashboard, inventory table, listing workbench |
| D: WhatsApp | 13-14 | Clawd tools for evaluate, quick list, stats |
| E: Taste Profile | 15 | Basic profile aggregation from sold items |
| F: Deployment | 16 | Vercel + Neon + Clerk + env setup |
| G: API Auth | 17 | Secure external API access for Clawd |

**Dependency order:** A → B → C (in parallel with D after B) → E → F → G

**What ships:** MG can photograph items, get instant AI analysis + pricing via WhatsApp or web app, generate Vinted listings with one click, track inventory and P&L, and copy listings to clipboard for Vinted. The taste profile starts learning from her first sale.
