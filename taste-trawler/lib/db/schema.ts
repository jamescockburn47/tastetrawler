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

/**
 * chat_images — every photo MG or James sends through the WhatsApp bot.
 *
 * The bot captures on sight (trigger or no trigger), uploads the bytes to
 * Vercel Blob, runs VLM analysis, and writes a row here. This is both
 * (a) a searchable index the bot can recall from later ("remember that
 * ceramic bowl?") and (b) a human-readable gallery on the website.
 *
 * `discussion` accretes: each time the bot answers a question that touches
 * this image, the reply gets appended so MG has a log of what was said.
 */
export const chatImages = pgTable('chat_images', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  blobUrl: text('blob_url').notNull(),
  vlmDescription: text('vlm_description').notNull().default(''),
  caption: text('caption'),
  jid: text('jid').notNull(),
  speakerName: text('speaker_name'),
  speakerId: text('speaker_id'),
  isGroup: text('is_group').notNull().default('false'),
  observedAt: timestamp('observed_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  discussion: text('discussion').notNull().default(''),
  // Structured analysis from MiniMax VLM — brand, category, condition, etc.
  // Stored on capture so tt_evaluate_item can read it without calling Gemini.
  vlmAnalysis: jsonb('vlm_analysis').$type<Record<string, unknown>>(),
  // Free-form labels lifted from the VLM description for cheap keyword recall
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ComparableSale = typeof comparableSales.$inferSelect;
export type ChatImage = typeof chatImages.$inferSelect;
export type NewChatImage = typeof chatImages.$inferInsert;
export type ThemeSettings = typeof themeSettings.$inferSelect;
export type NewThemeSettings = typeof themeSettings.$inferInsert;
export type ThemeHistoryRow = typeof themeHistory.$inferSelect;
