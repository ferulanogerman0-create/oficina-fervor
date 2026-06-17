CREATE TABLE IF NOT EXISTS "dm_conversations" (
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

CREATE TABLE IF NOT EXISTS "dm_messages" (
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

CREATE TABLE IF NOT EXISTS "ad_ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"campaign_meta_id" varchar(64),
	"adset_meta_id" varchar(64),
	"ad_meta_id" varchar(64),
	"name" varchar(256),
	"status" varchar(32),
	"effective_status" varchar(64),
	"creative_id" varchar(64),
	"spend" numeric(12,2) DEFAULT '0',
	"impressions" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"ctr" numeric(6,4),
	"cpc" numeric(10,2),
	"cpm" numeric(10,2),
	"frequency" numeric(6,2),
	"conversations" integer DEFAULT 0,
	"lead_results" integer DEFAULT 0,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ad_ads_ad_meta_id_unique" UNIQUE("ad_meta_id")
);

CREATE TABLE IF NOT EXISTS "web_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"path" varchar(256) NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"avg_duration_sec" integer,
	"bounce_rate" numeric(5,4),
	"ref_source" varchar(64),
	"ref_medium" varchar(64),
	"ref_campaign" varchar(128)
);

-- Extender metric_snapshots con nuevas cols
ALTER TABLE "metric_snapshots" ADD COLUMN IF NOT EXISTS "total_ad_spend" numeric(12,2);
ALTER TABLE "metric_snapshots" ADD COLUMN IF NOT EXISTS "total_ad_impressions" integer;
ALTER TABLE "metric_snapshots" ADD COLUMN IF NOT EXISTS "total_ad_clicks" integer;
ALTER TABLE "metric_snapshots" ADD COLUMN IF NOT EXISTS "total_ad_conversations" integer;
ALTER TABLE "metric_snapshots" ADD COLUMN IF NOT EXISTS "new_dms_count" integer;
ALTER TABLE "metric_snapshots" ADD COLUMN IF NOT EXISTS "new_leads_from_dm" integer;
ALTER TABLE "metric_snapshots" ADD COLUMN IF NOT EXISTS "total_web_pageviews" integer;

-- FKs
DO $$ BEGIN
  ALTER TABLE "dm_conversations" ADD CONSTRAINT "dm_conversations_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "dm_conversations" ADD CONSTRAINT "dm_conversations_lead_id_leads_id_fk"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_conversation_id_dm_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "dm_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ad_ads" ADD CONSTRAINT "ad_ads_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "web_visits" ADD CONSTRAINT "web_visits_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_dms_client_last" ON "dm_conversations" ("client_id","last_message_at");
CREATE INDEX IF NOT EXISTS "idx_dms_lead" ON "dm_conversations" ("tag_lead");
CREATE INDEX IF NOT EXISTS "idx_msgs_conv" ON "dm_messages" ("conversation_id","created_at");
CREATE INDEX IF NOT EXISTS "idx_ads_client_camp" ON "ad_ads" ("client_id","campaign_meta_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ux_web_client_date_path" ON "web_visits" ("client_id","date","path","ref_source");
