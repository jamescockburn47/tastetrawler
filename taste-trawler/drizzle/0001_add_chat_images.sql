CREATE TABLE "chat_images" (
	"id" text PRIMARY KEY NOT NULL,
	"blob_url" text NOT NULL,
	"vlm_description" text DEFAULT '' NOT NULL,
	"caption" text,
	"jid" text NOT NULL,
	"speaker_name" text,
	"speaker_id" text,
	"is_group" text DEFAULT 'false' NOT NULL,
	"observed_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"discussion" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
