import {
  pgTable, serial, varchar, text, integer, boolean, timestamp, numeric, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

// ====== AUTH ======
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: varchar('nombre', { length: 128 }).notNull(),
  email: varchar('email', { length: 128 }),
  role: varchar('role', { length: 32 }).default('owner').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ====== CLIENTES (multi-tenant lite — todo bajo Germán) ======
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  nombre: varchar('nombre', { length: 128 }).notNull(),
  rubro: varchar('rubro', { length: 64 }),
  estado: varchar('estado', { length: 32 }).default('activo').notNull(), // activo/pausado/cerrado
  prioridad: varchar('prioridad', { length: 16 }).default('media').notNull(),
  color: varchar('color', { length: 16 }), // hex de marca
  logoUrl: text('logo_url'),
  igHandle: varchar('ig_handle', { length: 64 }),
  fbPageUrl: text('fb_page_url'),
  whatsapp: varchar('whatsapp', { length: 32 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ====== META ACCOUNTS ======
export const metaAccounts = pgTable('meta_accounts', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  fbPageId: varchar('fb_page_id', { length: 64 }),
  fbPageAccessToken: text('fb_page_access_token'),
  igBusinessId: varchar('ig_business_id', { length: 64 }),
  adAccountId: varchar('ad_account_id', { length: 64 }), // act_xxxxx
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
}, (t) => ({ idxClient: uniqueIndex('idx_meta_client').on(t.clientId) }));

// ====== POSTS / REELS ======
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  platform: varchar('platform', { length: 16 }).notNull(), // instagram/facebook
  type: varchar('type', { length: 16 }).notNull(), // image/video/reel/carousel/story
  igMediaId: varchar('ig_media_id', { length: 64 }).unique(),
  permalink: text('permalink'),
  mediaUrl: text('media_url'),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  // métricas básicas
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  saves: integer('saves').default(0),
  reach: integer('reach').default(0),
  impressions: integer('impressions').default(0),
  // reel/video específicos
  videoViews: integer('video_views').default(0),
  plays: integer('plays').default(0),
  avgWatchSec: numeric('avg_watch_sec', { precision: 10, scale: 2 }),
  // engagement calculado
  engagementRate: numeric('engagement_rate', { precision: 6, scale: 4 }),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ idxClientPosted: index('idx_posts_client_posted').on(t.clientId, t.postedAt) }));

// ====== CAMPAIGNS Meta Ads ======
export const adCampaigns = pgTable('ad_campaigns', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  metaId: varchar('meta_id', { length: 64 }).unique(),
  name: varchar('name', { length: 256 }),
  objective: varchar('objective', { length: 64 }),
  status: varchar('status', { length: 32 }),  // ACTIVE/PAUSED/...
  dailyBudget: numeric('daily_budget', { precision: 12, scale: 2 }),
  spend: numeric('spend', { precision: 12, scale: 2 }).default('0'),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  ctr: numeric('ctr', { precision: 6, scale: 4 }),
  results: integer('results').default(0),
  costPerResult: numeric('cost_per_result', { precision: 10, scale: 2 }),
  startTime: timestamp('start_time', { withTimezone: true }),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ idxClient: index('idx_camp_client').on(t.clientId) }));

// ====== CRM LEADS ======
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  nombre: varchar('nombre', { length: 128 }).notNull(),
  telefono: varchar('telefono', { length: 32 }),
  email: varchar('email', { length: 128 }),
  fuente: varchar('fuente', { length: 32 }), // ads/organico/referido/wa/dm
  estado: varchar('estado', { length: 32 }).default('nuevo').notNull(), // nuevo/contactado/calificado/propuesta/cerrado/perdido
  motivo: text('motivo'),
  notas: text('notas'),
  ultimoContacto: timestamp('ultimo_contacto', { withTimezone: true }),
  proximoFollowup: timestamp('proximo_followup', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ idxClientEstado: index('idx_leads_client_estado').on(t.clientId, t.estado) }));

// ====== TAREAS ======
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  detalle: text('detalle'),
  done: boolean('done').default(false).notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  prioridad: varchar('prioridad', { length: 16 }).default('media'),
  categoria: varchar('categoria', { length: 32 }), // ads/contenido/crm/admin
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ idxClientDone: index('idx_tasks_client_done').on(t.clientId, t.done) }));

// ====== CONTENT BOARD (ideas → produccion → posteado) ======
export const contentIdeas = pgTable('content_ideas', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  formato: varchar('formato', { length: 32 }).notNull(), // carrusel/post/story/reel
  hook: text('hook'),
  notas: text('notas'),
  estado: varchar('estado', { length: 32 }).default('idea').notNull(), // idea/produccion/aprobado/posteado
  plannedFor: timestamp('planned_for', { withTimezone: true }),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ idxClientEstado: index('idx_ideas_client_estado').on(t.clientId, t.estado) }));

// ====== METRIC SNAPSHOTS (trends diarios) ======
export const metricSnapshots = pgTable('metric_snapshots', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  followers: integer('followers'),
  reach: integer('reach'),
  impressions: integer('impressions'),
  profileVisits: integer('profile_visits'),
  websiteClicks: integer('website_clicks'),
  adSpend: numeric('ad_spend', { precision: 12, scale: 2 }),
  adResults: integer('ad_results'),
  newLeads: integer('new_leads'),
  raw: jsonb('raw'), // payload completo de Meta por las dudas
}, (t) => ({
  uxClientDate: uniqueIndex('ux_snap_client_date').on(t.clientId, t.date),
}));
