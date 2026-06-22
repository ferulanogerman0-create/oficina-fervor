-- 0006: Propuestas — token público + tracking views
ALTER TABLE "propuestas" ADD COLUMN IF NOT EXISTS "public_token" varchar(64);
ALTER TABLE "propuestas" ADD COLUMN IF NOT EXISTS "viewed_at" timestamp with time zone;
ALTER TABLE "propuestas" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0 NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_propuestas_token" ON "propuestas" ("public_token");
