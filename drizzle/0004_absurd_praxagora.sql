CREATE TABLE "ad_ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"campaign_meta_id" varchar(64),
	"adset_meta_id" varchar(64),
	"ad_meta_id" varchar(64),
	"name" varchar(256),
	"status" varchar(32),
	"effective_status" varchar(64),
	"creative_id" varchar(64),
	"spend" numeric(12, 2) DEFAULT '0',
	"impressions" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"ctr" numeric(6, 4),
	"cpc" numeric(10, 2),
	"cpm" numeric(10, 2),
	"frequency" numeric(6, 2),
	"conversations" integer DEFAULT 0,
	"lead_results" integer DEFAULT 0,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ad_ads_ad_meta_id_unique" UNIQUE("ad_meta_id")
);
--> statement-breakpoint
CREATE TABLE "bug_reports" (
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
CREATE TABLE "dm_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"platform" varchar(16) NOT NULL,
	"meta_conv_id" varchar(128),
	"participant_id" varchar(128),
	"participant_name" varchar(256),
	"participant_handle" varchar(128),
	"last_message_at" timestamp with time zone,
	"last_message_preview" text,
	"unread" integer DEFAULT 0 NOT NULL,
	"msg_count" integer DEFAULT 0 NOT NULL,
	"tag_lead" boolean DEFAULT false NOT NULL,
	"lead_id" integer,
	"source_ad_id" varchar(64),
	"source_post_id" varchar(64),
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "dm_conversations_meta_conv_id_unique" UNIQUE("meta_conv_id")
);
--> statement-breakpoint
CREATE TABLE "dm_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"meta_msg_id" varchar(128),
	"from_me" boolean NOT NULL,
	"body" text,
	"attachment_type" varchar(32),
	"attachment_url" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "dm_messages_meta_msg_id_unique" UNIQUE("meta_msg_id")
);
--> statement-breakpoint
CREATE TABLE "google_calendar_creds" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"calendar_id" varchar(256) DEFAULT 'primary' NOT NULL,
	"scope" text,
	"token_type" varchar(32) DEFAULT 'Bearer',
	"expires_at" timestamp with time zone NOT NULL,
	"email" varchar(128),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habito_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"habito_id" integer NOT NULL,
	"fecha" varchar(10) NOT NULL,
	"completado" boolean DEFAULT false NOT NULL,
	"tiempo_real_min" integer,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habitos" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(256) NOT NULL,
	"descripcion" text,
	"categoria" varchar(32) NOT NULL,
	"frecuencia" varchar(16) NOT NULL,
	"dias_semana" varchar(16),
	"dia_mes" integer,
	"hora_default" varchar(5),
	"tiempo_estimado_min" integer DEFAULT 30,
	"objetivo_id" integer,
	"gcal_event_id" text,
	"color" varchar(16) DEFAULT '#FF5A1F',
	"emoji" varchar(8),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objetivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(256) NOT NULL,
	"descripcion" text,
	"tipo" varchar(32) NOT NULL,
	"categoria" varchar(64),
	"fecha_inicio" varchar(10) NOT NULL,
	"fecha_fin" varchar(10) NOT NULL,
	"kpi_unidad" varchar(32),
	"kpi_target" numeric(14, 2),
	"kpi_actual" numeric(14, 2) DEFAULT '0',
	"estado" varchar(32) DEFAULT 'activo' NOT NULL,
	"color" varchar(16) DEFAULT '#FF5A1F',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"path" varchar(256) NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"avg_duration_sec" integer,
	"bounce_rate" numeric(5, 4),
	"ref_source" varchar(64),
	"ref_medium" varchar(64),
	"ref_campaign" varchar(128)
);
--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "total_ad_spend" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "total_ad_impressions" integer;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "total_ad_clicks" integer;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "total_ad_conversations" integer;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "new_dms_count" integer;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "new_leads_from_dm" integer;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "total_web_pageviews" integer;--> statement-breakpoint
ALTER TABLE "ad_ads" ADD CONSTRAINT "ad_ads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_conversations" ADD CONSTRAINT "dm_conversations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_conversations" ADD CONSTRAINT "dm_conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_conversation_id_dm_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."dm_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habito_completions" ADD CONSTRAINT "habito_completions_habito_id_habitos_id_fk" FOREIGN KEY ("habito_id") REFERENCES "public"."habitos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habitos" ADD CONSTRAINT "habitos_objetivo_id_objetivos_id_fk" FOREIGN KEY ("objetivo_id") REFERENCES "public"."objetivos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_visits" ADD CONSTRAINT "web_visits_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ads_client_camp" ON "ad_ads" USING btree ("client_id","campaign_meta_id");--> statement-breakpoint
CREATE INDEX "ix_bug_app" ON "bug_reports" USING btree ("app");--> statement-breakpoint
CREATE INDEX "ix_bug_estado" ON "bug_reports" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_dms_client_last" ON "dm_conversations" USING btree ("client_id","last_message_at");--> statement-breakpoint
CREATE INDEX "idx_dms_lead" ON "dm_conversations" USING btree ("tag_lead");--> statement-breakpoint
CREATE INDEX "idx_msgs_conv" ON "dm_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_completion_habito_fecha" ON "habito_completions" USING btree ("habito_id","fecha");--> statement-breakpoint
CREATE INDEX "idx_habitos_activo" ON "habitos" USING btree ("activo");--> statement-breakpoint
CREATE INDEX "idx_habitos_categoria" ON "habitos" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "idx_objetivos_estado" ON "objetivos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_objetivos_tipo" ON "objetivos" USING btree ("tipo");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_web_client_date_path" ON "web_visits" USING btree ("client_id","date","path","ref_source");