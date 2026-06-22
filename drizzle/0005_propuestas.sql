-- 0005: Propuestas comerciales (PDF generator)
CREATE TABLE IF NOT EXISTS "propuestas" (
  "id" serial PRIMARY KEY,
  "client_name" varchar(256) NOT NULL,
  "client_email" varchar(256),
  "client_negocio" varchar(256),
  "servicios" jsonb NOT NULL,
  "setup_total" numeric(12,2) DEFAULT '0' NOT NULL,
  "mrr_total" numeric(12,2) DEFAULT '0' NOT NULL,
  "currency" varchar(8) DEFAULT 'USD' NOT NULL,
  "notas_internas" text,
  "estado" varchar(32) DEFAULT 'borrador' NOT NULL,
  "pdf_url" text,
  "sent_at" timestamp with time zone,
  "accepted_at" timestamp with time zone,
  "validity_days" integer DEFAULT 7 NOT NULL,
  "lead_id" integer REFERENCES "leads"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_propuestas_estado" ON "propuestas" ("estado");
