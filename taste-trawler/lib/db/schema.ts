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
