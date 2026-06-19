CREATE TABLE IF NOT EXISTS "bug_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"app" varchar(48) NOT NULL,
	"mensaje" text NOT NULL,
	"url" varchar(512),
	"usuario" varchar(128),
	"contacto" varchar(160),
	"user_agent" varchar(512),
	"estado" varchar(24) DEFAULT 'nuevo' NOT NULL,
	"nota" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_bug_app" ON "bug_reports" USING btree ("app");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_bug_estado" ON "bug_reports" USING btree ("estado");
