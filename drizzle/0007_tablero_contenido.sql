CREATE TABLE IF NOT EXISTS "ganchos" (
	"id" serial PRIMARY KEY NOT NULL,
	"texto" text NOT NULL,
	"plantilla" text,
	"angulos" jsonb,
	"nicho" varchar(64),
	"tipo" varchar(48),
	"autor_handle" varchar(128),
	"autor_seguidores" integer,
	"fuente_url" text,
	"vistas" integer,
	"plataforma" varchar(24),
	"usado" boolean DEFAULT false NOT NULL,
	"favorito" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tendencias" (
	"id" serial PRIMARY KEY NOT NULL,
	"fuente" varchar(64) NOT NULL,
	"titulo" varchar(512) NOT NULL,
	"url" text,
	"resumen" text,
	"categoria" varchar(24) DEFAULT 'ignorar' NOT NULL,
	"potencial" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archivado" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ganchos_nicho" ON "ganchos" ("nicho");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ganchos_tipo" ON "ganchos" ("tipo");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ux_tendencias_url" ON "tendencias" ("url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tendencias_categoria" ON "tendencias" ("categoria","potencial");--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "plataforma" varchar(24);--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "guion" text;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD COLUMN IF NOT EXISTS "gancho_id" integer;
