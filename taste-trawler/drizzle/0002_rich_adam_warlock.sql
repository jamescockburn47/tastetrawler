CREATE TABLE "theme_history" (
	"id" text PRIMARY KEY NOT NULL,
	"theme_name" text NOT NULL,
	"dials" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_settings" (
	"theme_name" text PRIMARY KEY NOT NULL,
	"dials" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
