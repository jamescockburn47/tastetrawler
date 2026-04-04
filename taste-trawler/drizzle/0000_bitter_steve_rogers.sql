CREATE TYPE "public"."item_source" AS ENUM('charity_shop', 'vinted_flip', 'ebay', 'sale', 'other');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('draft', 'listed', 'sold', 'stale', 'archived');--> statement-breakpoint
CREATE TABLE "comparable_sales" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text,
	"platform" text NOT NULL,
	"item_title" text NOT NULL,
	"sold_price" integer,
	"sold_at" timestamp,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"brand" text,
	"category" text,
	"condition" text,
	"era" text,
	"colours" jsonb DEFAULT '[]'::jsonb,
	"style_tags" jsonb DEFAULT '[]'::jsonb,
	"material" text,
	"size" text,
	"buy_price" integer,
	"list_price" integer,
	"sold_price" integer,
	"sold_at" timestamp,
	"listed_at" timestamp,
	"source" "item_source" DEFAULT 'charity_shop' NOT NULL,
	"status" "item_status" DEFAULT 'draft' NOT NULL,
	"vinted_listing_id" text,
	"taste_vector" jsonb,
	"story_potential_score" real,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comparable_sales" ADD CONSTRAINT "comparable_sales_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;