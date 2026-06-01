CREATE TABLE "ad_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"meta_id" varchar(64),
	"name" varchar(256),
	"objective" varchar(64),
	"status" varchar(32),
	"daily_budget" numeric(12, 2),
	"spend" numeric(12, 2) DEFAULT '0',
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"ctr" numeric(6, 4),
	"results" integer DEFAULT 0,
	"cost_per_result" numeric(10, 2),
	"start_time" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ad_campaigns_meta_id_unique" UNIQUE("meta_id")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"nombre" varchar(128) NOT NULL,
	"rubro" varchar(64),
	"estado" varchar(32) DEFAULT 'activo' NOT NULL,
	"prioridad" varchar(16) DEFAULT 'media' NOT NULL,
	"color" varchar(16),
	"logo_url" text,
	"ig_handle" varchar(64),
	"fb_page_url" text,
	"whatsapp" varchar(32),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"titulo" varchar(256) NOT NULL,
	"formato" varchar(32) NOT NULL,
	"hook" text,
	"notas" text,
	"estado" varchar(32) DEFAULT 'idea' NOT NULL,
	"planned_for" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"post_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"nombre" varchar(128) NOT NULL,
	"telefono" varchar(32),
	"email" varchar(128),
	"fuente" varchar(32),
	"estado" varchar(32) DEFAULT 'nuevo' NOT NULL,
	"motivo" text,
	"notas" text,
	"ultimo_contacto" timestamp with time zone,
	"proximo_followup" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"fb_page_id" varchar(64),
	"fb_page_access_token" text,
	"ig_business_id" varchar(64),
	"ad_account_id" varchar(64),
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "metric_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"followers" integer,
	"reach" integer,
	"impressions" integer,
	"profile_visits" integer,
	"website_clicks" integer,
	"ad_spend" numeric(12, 2),
	"ad_results" integer,
	"new_leads" integer,
	"raw" jsonb
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"platform" varchar(16) NOT NULL,
	"type" varchar(16) NOT NULL,
	"ig_media_id" varchar(64),
	"permalink" text,
	"media_url" text,
	"thumbnail_url" text,
	"caption" text,
	"posted_at" timestamp with time zone,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"video_views" integer DEFAULT 0,
	"plays" integer DEFAULT 0,
	"avg_watch_sec" numeric(10, 2),
	"engagement_rate" numeric(6, 4),
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "posts_ig_media_id_unique" UNIQUE("ig_media_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"titulo" varchar(256) NOT NULL,
	"detalle" text,
	"done" boolean DEFAULT false NOT NULL,
	"due_at" timestamp with time zone,
	"prioridad" varchar(16) DEFAULT 'media',
	"categoria" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"nombre" varchar(128) NOT NULL,
	"email" varchar(128),
	"role" varchar(32) DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_accounts" ADD CONSTRAINT "meta_accounts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_camp_client" ON "ad_campaigns" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_ideas_client_estado" ON "content_ideas" USING btree ("client_id","estado");--> statement-breakpoint
CREATE INDEX "idx_leads_client_estado" ON "leads" USING btree ("client_id","estado");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_meta_client" ON "meta_accounts" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_snap_client_date" ON "metric_snapshots" USING btree ("client_id","date");--> statement-breakpoint
CREATE INDEX "idx_posts_client_posted" ON "posts" USING btree ("client_id","posted_at");--> statement-breakpoint
CREATE INDEX "idx_tasks_client_done" ON "tasks" USING btree ("client_id","done");