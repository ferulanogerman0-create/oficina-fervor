-- 0003: Habits + Objetivos + GCal + extend tasks
-- Generated 2026-06-18

-- ===== OBJETIVOS =====
CREATE TABLE IF NOT EXISTS "objetivos" (
  "id" serial PRIMARY KEY,
  "titulo" varchar(256) NOT NULL,
  "descripcion" text,
  "tipo" varchar(32) NOT NULL,
  "categoria" varchar(64),
  "fecha_inicio" varchar(10) NOT NULL,
  "fecha_fin" varchar(10) NOT NULL,
  "kpi_unidad" varchar(32),
  "kpi_target" numeric(14,2),
  "kpi_actual" numeric(14,2) DEFAULT '0',
  "estado" varchar(32) DEFAULT 'activo' NOT NULL,
  "color" varchar(16) DEFAULT '#FF5A1F',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_objetivos_estado" ON "objetivos" ("estado");
CREATE INDEX IF NOT EXISTS "idx_objetivos_tipo" ON "objetivos" ("tipo");

-- ===== HABITOS =====
CREATE TABLE IF NOT EXISTS "habitos" (
  "id" serial PRIMARY KEY,
  "titulo" varchar(256) NOT NULL,
  "descripcion" text,
  "categoria" varchar(32) NOT NULL,
  "frecuencia" varchar(16) NOT NULL,
  "dias_semana" varchar(16),
  "dia_mes" integer,
  "hora_default" varchar(5),
  "tiempo_estimado_min" integer DEFAULT 30,
  "objetivo_id" integer REFERENCES "objetivos"("id") ON DELETE SET NULL,
  "gcal_event_id" text,
  "color" varchar(16) DEFAULT '#FF5A1F',
  "emoji" varchar(8),
  "activo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_habitos_activo" ON "habitos" ("activo");
CREATE INDEX IF NOT EXISTS "idx_habitos_categoria" ON "habitos" ("categoria");

-- ===== HABITO COMPLETIONS =====
CREATE TABLE IF NOT EXISTS "habito_completions" (
  "id" serial PRIMARY KEY,
  "habito_id" integer NOT NULL REFERENCES "habitos"("id") ON DELETE CASCADE,
  "fecha" varchar(10) NOT NULL,
  "completado" boolean DEFAULT false NOT NULL,
  "tiempo_real_min" integer,
  "notas" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ux_completion_habito_fecha" ON "habito_completions" ("habito_id","fecha");

-- ===== TAREAS: extend existing =====
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "objetivo_id" integer REFERENCES "objetivos"("id") ON DELETE SET NULL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "gcal_event_id" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "tipo" varchar(16) DEFAULT 'one_off';

-- ===== GOOGLE CALENDAR CREDS =====
CREATE TABLE IF NOT EXISTS "google_calendar_creds" (
  "id" serial PRIMARY KEY,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "calendar_id" varchar(256) DEFAULT 'primary' NOT NULL,
  "scope" text,
  "token_type" varchar(32) DEFAULT 'Bearer',
  "expires_at" timestamp with time zone NOT NULL,
  "email" varchar(128),
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
