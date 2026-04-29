CREATE TYPE "public"."sale_status" AS ENUM('draft', 'needs_review', 'confirmed', 'void');--> statement-breakpoint
CREATE TYPE "public"."sale_platform" AS ENUM('vinted', 'ebay', 'depop', 'in_person', 'other');--> statement-breakpoint
CREATE TYPE "public"."sale_event_type" AS ENUM('created', 'updated', 'confirmed', 'voided', 'linked_item', 'linked_image');--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text,
	"chat_image_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sale_price" integer,
	"buy_price_at_sale" integer,
	"fees" integer DEFAULT 0 NOT NULL,
	"postage" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"net_proceeds" integer,
	"platform" "sale_platform" DEFAULT 'vinted' NOT NULL,
	"sold_at" timestamp,
	"notes" text,
	"source_jid" text,
	"source_message" text,
	"confidence" real DEFAULT 0 NOT NULL,
	"status" "sale_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp
);--> statement-breakpoint
CREATE TABLE "sale_events" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"type" "sale_event_type" NOT NULL,
	"actor" text DEFAULT 'bot' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_events" ADD CONSTRAINT "sale_events_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "sales" (
	"id",
	"item_id",
	"chat_image_ids",
	"sale_price",
	"buy_price_at_sale",
	"net_proceeds",
	"platform",
	"sold_at",
	"notes",
	"confidence",
	"status",
	"created_at",
	"updated_at",
	"confirmed_at"
)
SELECT
	'id_' || replace(i."id", '-', '_') || '_sale',
	i."id",
	'[]'::jsonb,
	i."sold_price",
	i."buy_price",
	i."sold_price",
	'vinted',
	i."sold_at",
	'Backfilled from legacy sold item fields.',
	0.5,
	'confirmed',
	coalesce(i."sold_at", i."updated_at", now()),
	now(),
	coalesce(i."sold_at", now())
FROM "items" i
WHERE i."status" = 'sold'
  AND NOT EXISTS (
	SELECT 1 FROM "sales" s WHERE s."item_id" = i."id" AND s."status" = 'confirmed'
  );--> statement-breakpoint
INSERT INTO "sale_events" ("id", "sale_id", "type", "actor", "message", "payload", "created_at")
SELECT
	'id_' || replace(i."id", '-', '_') || '_sale_backfill',
	'id_' || replace(i."id", '-', '_') || '_sale',
	'created',
	'system',
	'Backfilled confirmed sale from legacy item fields.',
	'{}'::jsonb,
	now()
FROM "items" i
WHERE i."status" = 'sold';
