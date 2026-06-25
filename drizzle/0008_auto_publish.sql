ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "caption" text;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "image_data" text;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "image_mime" varchar(32);--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "auto_publish" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "publish_status" varchar(16);--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "publish_error" text;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "ig_published_media_id" varchar(64);--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "fb_post_id" varchar(64);
