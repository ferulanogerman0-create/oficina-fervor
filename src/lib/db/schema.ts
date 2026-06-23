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
  esPropio: boolean('es_propio').default(false).notNull(), // true = cuenta propia FERVOR (oficina central)
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
  // calendario de contenido
  plataforma: varchar('plataforma', { length: 24 }), // instagram / tiktok / youtube / linkedin
  guion: text('guion'), // guion completo del contenido
  ganchoId: integer('gancho_id'), // FK lógico a ganchos.id (sin constraint para no acoplar)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ idxClientEstado: index('idx_ideas_client_estado').on(t.clientId, t.estado) }));

// ====== TABLERO DE CONTENIDO — BAÚL DE GANCHOS ======
export const ganchos = pgTable('ganchos', {
  id: serial('id').primaryKey(),
  texto: text('texto').notNull(), // el gancho original / transcripción
  plantilla: text('plantilla'), // versión reusable (con [variables]) generada por IA
  angulos: jsonb('angulos'), // string[] de ángulos sugeridos para reusarlo
  nicho: varchar('nicho', { length: 64 }), // automotriz / saas / agencias / contable / marketing / general
  tipo: varchar('tipo', { length: 48 }), // pregunta / contraste / lista / historia / dato / polemica / promesa
  autorHandle: varchar('autor_handle', { length: 128 }), // quién lo tiró primero
  autorSeguidores: integer('autor_seguidores'),
  fuenteUrl: text('fuente_url'),
  vistas: integer('vistas'),
  plataforma: varchar('plataforma', { length: 24 }), // instagram / tiktok / youtube / linkedin
  usado: boolean('usado').default(false).notNull(),
  favorito: boolean('favorito').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxNicho: index('idx_ganchos_nicho').on(t.nicho),
  idxTipo: index('idx_ganchos_tipo').on(t.tipo),
}));

// ====== TABLERO DE CONTENIDO — TENDENCIAS (12 fuentes/día) ======
export const tendencias = pgTable('tendencias', {
  id: serial('id').primaryKey(),
  fuente: varchar('fuente', { length: 64 }).notNull(), // anthropic / openai / x / nicho
  titulo: varchar('titulo', { length: 512 }).notNull(),
  url: text('url'),
  resumen: text('resumen'), // resumen corto generado por IA
  categoria: varchar('categoria', { length: 24 }).default('ignorar').notNull(), // gancho / explicativo / ignorar
  potencial: integer('potencial').default(0).notNull(), // 0-100 score de potencial de contenido
  publishedAt: timestamp('published_at', { withTimezone: true }),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  archivado: boolean('archivado').default(false).notNull(),
}, (t) => ({
  uxUrl: uniqueIndex('ux_tendencias_url').on(t.url),
  idxCategoria: index('idx_tendencias_categoria').on(t.categoria, t.potencial),
}));

// ====== DMs (Instagram Direct + Messenger conversations) ======
export const dmConversations = pgTable('dm_conversations', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  platform: varchar('platform', { length: 16 }).notNull(), // instagram / messenger
  metaConvId: varchar('meta_conv_id', { length: 128 }).unique(),
  participantId: varchar('participant_id', { length: 128 }),
  participantName: varchar('participant_name', { length: 256 }),
  participantHandle: varchar('participant_handle', { length: 128 }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  lastMessagePreview: text('last_message_preview'),
  unread: integer('unread').default(0).notNull(),
  msgCount: integer('msg_count').default(0).notNull(),
  // CRM tag: ¿este conversation generó interés / lead?
  tagLead: boolean('tag_lead').default(false).notNull(),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  // source attribution si vino de un ad / post
  sourceAdId: varchar('source_ad_id', { length: 64 }),
  sourcePostId: varchar('source_post_id', { length: 64 }),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  idxClientLast: index('idx_dms_client_last').on(t.clientId, t.lastMessageAt),
  idxLead: index('idx_dms_lead').on(t.tagLead),
}));

export const dmMessages = pgTable('dm_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => dmConversations.id, { onDelete: 'cascade' }).notNull(),
  metaMsgId: varchar('meta_msg_id', { length: 128 }).unique(),
  fromMe: boolean('from_me').notNull(),
  body: text('body'),
  attachmentType: varchar('attachment_type', { length: 32 }), // image/video/audio/story_mention/ig_reel
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
}, (t) => ({
  idxConv: index('idx_msgs_conv').on(t.conversationId, t.createdAt),
}));

// ====== AD-LEVEL data (ad set + ad insights) ======
export const adAds = pgTable('ad_ads', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  campaignMetaId: varchar('campaign_meta_id', { length: 64 }), // FK al ad_campaigns.metaId
  adSetMetaId: varchar('adset_meta_id', { length: 64 }),
  adMetaId: varchar('ad_meta_id', { length: 64 }).unique(),
  name: varchar('name', { length: 256 }),
  status: varchar('status', { length: 32 }),
  effectiveStatus: varchar('effective_status', { length: 64 }),
  creativeId: varchar('creative_id', { length: 64 }),
  // insights snapshot
  spend: numeric('spend', { precision: 12, scale: 2 }).default('0'),
  impressions: integer('impressions').default(0),
  reach: integer('reach').default(0),
  clicks: integer('clicks').default(0),
  ctr: numeric('ctr', { precision: 6, scale: 4 }),
  cpc: numeric('cpc', { precision: 10, scale: 2 }),
  cpm: numeric('cpm', { precision: 10, scale: 2 }),
  frequency: numeric('frequency', { precision: 6, scale: 2 }),
  conversations: integer('conversations').default(0), // onsite_conversion.messaging_conversation_started_7d
  leadResults: integer('lead_results').default(0),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  idxClientCampaign: index('idx_ads_client_camp').on(t.clientId, t.campaignMetaId),
}));

// ====== WEB ANALYTICS (pageviews wolfdma.website + landings) ======
export const webVisits = pgTable('web_visits', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  path: varchar('path', { length: 256 }).notNull(), // /privacy, /, /caso-fma, etc
  pageviews: integer('pageviews').default(0).notNull(),
  uniqueVisitors: integer('unique_visitors').default(0).notNull(),
  avgDurationSec: integer('avg_duration_sec'),
  bounceRate: numeric('bounce_rate', { precision: 5, scale: 4 }),
  // attribution
  refSource: varchar('ref_source', { length: 64 }), // direct/google/instagram/ad
  refMedium: varchar('ref_medium', { length: 64 }), // organic/cpc/referral/social
  refCampaign: varchar('ref_campaign', { length: 128 }),
}, (t) => ({
  uxClientDatePath: uniqueIndex('ux_web_client_date_path').on(t.clientId, t.date, t.path, t.refSource),
}));

// ====== PROPUESTAS comerciales (PDF generator) ======
export const propuestas = pgTable('propuestas', {
  id: serial('id').primaryKey(),
  clientName: varchar('client_name', { length: 256 }).notNull(),
  clientEmail: varchar('client_email', { length: 256 }),
  clientNegocio: varchar('client_negocio', { length: 256 }),
  servicios: jsonb('servicios').notNull(), // [{key, label, descripcion, setup, mrr, incluido}]
  setupTotal: numeric('setup_total', { precision: 12, scale: 2 }).default('0').notNull(),
  mrrTotal: numeric('mrr_total', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 8 }).default('USD').notNull(),
  notasInternas: text('notas_internas'),
  estado: varchar('estado', { length: 32 }).default('borrador').notNull(), // borrador/enviada/aceptada/rechazada
  pdfUrl: text('pdf_url'), // path interno o URL pública
  sentAt: timestamp('sent_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  validityDays: integer('validity_days').default(7).notNull(),
  publicToken: varchar('public_token', { length: 64 }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }),
  viewCount: integer('view_count').default(0).notNull(),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxEstado: index('idx_propuestas_estado').on(t.estado),
  uniqToken: uniqueIndex('uniq_propuestas_token').on(t.publicToken),
}));

// ====== OBJETIVOS (90d / mensual / semanal) ======
export const objetivos = pgTable('objetivos', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  descripcion: text('descripcion'),
  tipo: varchar('tipo', { length: 32 }).notNull(), // 90d / mensual / semanal / anual
  categoria: varchar('categoria', { length: 64 }), // captacion / contenido / delivery / ingresos / admin
  fechaInicio: varchar('fecha_inicio', { length: 10 }).notNull(), // YYYY-MM-DD
  fechaFin: varchar('fecha_fin', { length: 10 }).notNull(),
  kpiUnidad: varchar('kpi_unidad', { length: 32 }), // USD / clientes / conexiones / posts / calls
  kpiTarget: numeric('kpi_target', { precision: 14, scale: 2 }),
  kpiActual: numeric('kpi_actual', { precision: 14, scale: 2 }).default('0'),
  estado: varchar('estado', { length: 32 }).default('activo').notNull(), // activo / cumplido / fallido / pausado
  color: varchar('color', { length: 16 }).default('#FF5A1F'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxEstado: index('idx_objetivos_estado').on(t.estado),
  idxTipo: index('idx_objetivos_tipo').on(t.tipo),
}));

// ====== HABITOS (recurrentes diarios/semanales/mensuales) ======
export const habitos = pgTable('habitos', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  descripcion: text('descripcion'),
  categoria: varchar('categoria', { length: 32 }).notNull(), // captacion / contenido / delivery / admin / personal
  frecuencia: varchar('frecuencia', { length: 16 }).notNull(), // diaria / semanal / mensual
  diasSemana: varchar('dias_semana', { length: 16 }), // "1,2,3,4,5" Lun-Vie (frecuencia diaria) o "1" (semanal Lun)
  diaMes: integer('dia_mes'), // 1-31 o -1 = ultimo día (frecuencia mensual)
  horaDefault: varchar('hora_default', { length: 5 }), // HH:MM
  tiempoEstimadoMin: integer('tiempo_estimado_min').default(30),
  objetivoId: integer('objetivo_id').references(() => objetivos.id, { onDelete: 'set null' }),
  gcalEventId: text('gcal_event_id'), // recurring event id en Google Calendar
  color: varchar('color', { length: 16 }).default('#FF5A1F'),
  emoji: varchar('emoji', { length: 8 }),
  activo: boolean('activo').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxActivo: index('idx_habitos_activo').on(t.activo),
  idxCategoria: index('idx_habitos_categoria').on(t.categoria),
}));

// ====== HABITO COMPLETIONS (tracking diario) ======
export const habitoCompletions = pgTable('habito_completions', {
  id: serial('id').primaryKey(),
  habitoId: integer('habito_id').references(() => habitos.id, { onDelete: 'cascade' }).notNull(),
  fecha: varchar('fecha', { length: 10 }).notNull(), // YYYY-MM-DD
  completado: boolean('completado').default(false).notNull(),
  tiempoRealMin: integer('tiempo_real_min'),
  notas: text('notas'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxHabitoFecha: uniqueIndex('ux_completion_habito_fecha').on(t.habitoId, t.fecha),
}));

// ====== TAREAS (extender existente con objetivo + gcal) ======
// NOTE: ya existe `tasks`. Acá agregamos columnas vía migración.
// objetivoId + gcalEventId + tipo (one_off/recurring) van como migration SQL alter.

// ====== GOOGLE CALENDAR CREDS (single row para owner) ======
export const googleCalendarCreds = pgTable('google_calendar_creds', {
  id: serial('id').primaryKey(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  calendarId: varchar('calendar_id', { length: 256 }).default('primary').notNull(),
  scope: text('scope'),
  tokenType: varchar('token_type', { length: 32 }).default('Bearer'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  email: varchar('email', { length: 128 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
  // ads (campaña agregado)
  totalAdSpend: numeric('total_ad_spend', { precision: 12, scale: 2 }),
  totalAdImpressions: integer('total_ad_impressions'),
  totalAdClicks: integer('total_ad_clicks'),
  totalAdConversations: integer('total_ad_conversations'),
  // dms
  newDmsCount: integer('new_dms_count'),
  newLeadsFromDm: integer('new_leads_from_dm'),
  // web
  totalWebPageviews: integer('total_web_pageviews'),
  raw: jsonb('raw'), // payload completo de Meta por las dudas
}, (t) => ({
  uxClientDate: uniqueIndex('ux_snap_client_date').on(t.clientId, t.date),
}));

// ====== BUG REPORTS / SOPORTE (colector central de todas las apps) ======
export const bugReports = pgTable('bug_reports', {
  id: serial('id').primaryKey(),
  app: varchar('app', { length: 48 }).notNull(), // tutaller / agenciafacil / fma / oficina
  mensaje: text('mensaje').notNull(),
  url: varchar('url', { length: 512 }), // página donde estaba el user
  usuario: varchar('usuario', { length: 128 }), // quién reporta (si la app lo manda)
  contacto: varchar('contacto', { length: 160 }), // email/tel opcional
  userAgent: varchar('user_agent', { length: 512 }),
  estado: varchar('estado', { length: 24 }).default('nuevo').notNull(), // nuevo / revisado / resuelto / descartado
  nota: text('nota'), // mi diagnóstico / solución propuesta
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  ixApp: index('ix_bug_app').on(t.app),
  ixEstado: index('ix_bug_estado').on(t.estado),
}));
