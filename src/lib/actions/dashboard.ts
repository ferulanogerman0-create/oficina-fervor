'use server';
import { db, schema } from '@/lib/db';
import { and, eq, gte, sql, desc } from 'drizzle-orm';
import { ctx } from './_ctx';

/** KPIs globales del dashboard home (todos los clientes). */
export async function dashboardKpis() {
  await ctx();
  const desde30 = new Date(Date.now() - 30 * 86400_000);

  const [posts] = await db.select({
    reach: sql<number>`coalesce(sum(${schema.posts.reach}),0)`,
    engagement: sql<number>`coalesce(sum(${schema.posts.likes} + ${schema.posts.comments} + ${schema.posts.shares} + ${schema.posts.saves}),0)`,
  }).from(schema.posts).where(gte(schema.posts.postedAt, desde30));

  const [leads] = await db.select({ n: sql<number>`count(*)` })
    .from(schema.leads).where(gte(schema.leads.createdAt, desde30));

  const [ads] = await db.select({
    spend: sql<number>`coalesce(sum(${schema.adCampaigns.spend}),0)`,
    results: sql<number>`coalesce(sum(${schema.adCampaigns.results}),0)`,
  }).from(schema.adCampaigns);

  const spend = Number(ads.spend) || 0;
  const results = Number(ads.results) || 0;
  return {
    reach: Number(posts.reach) || 0,
    engagement: Number(posts.engagement) || 0,
    leads: Number(leads.n) || 0,
    adSpend: spend,
    costPerResult: results > 0 ? spend / results : null,
  };
}

/** Trend 14 días agregando snapshots de todos los clientes (reach + engagement proxy). */
export async function dashboardTrend() {
  await ctx();
  const since = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
  const rows = await db.select({
    date: schema.metricSnapshots.date,
    reach: sql<number>`coalesce(sum(${schema.metricSnapshots.reach}),0)`,
    leads: sql<number>`coalesce(sum(${schema.metricSnapshots.newLeads}),0)`,
  }).from(schema.metricSnapshots)
    .where(gte(schema.metricSnapshots.date, since))
    .groupBy(schema.metricSnapshots.date)
    .orderBy(schema.metricSnapshots.date);
  return rows.map((r) => ({ d: r.date.slice(8, 10), reach: Number(r.reach), engagement: Number(r.leads) }));
}

/** Cartera de clientes con conteo de leads abiertos. */
export async function dashboardClientes() {
  await ctx();
  return await db.select({
    id: schema.clients.id, slug: schema.clients.slug, nombre: schema.clients.nombre,
    rubro: schema.clients.rubro, estado: schema.clients.estado, color: schema.clients.color,
    esPropio: schema.clients.esPropio,
  }).from(schema.clients).where(eq(schema.clients.estado, 'activo'))
    .orderBy(desc(schema.clients.esPropio), desc(schema.clients.createdAt)).limit(8);
}

/** Tareas pendientes (no done) próximas. */
export async function dashboardTareas() {
  await ctx();
  return await db.select({
    id: schema.tasks.id, titulo: schema.tasks.titulo, categoria: schema.tasks.categoria,
    dueAt: schema.tasks.dueAt, prioridad: schema.tasks.prioridad,
    cliente: schema.clients.nombre,
  }).from(schema.tasks)
    .leftJoin(schema.clients, eq(schema.tasks.clientId, schema.clients.id))
    .where(eq(schema.tasks.done, false))
    .orderBy(schema.tasks.dueAt).limit(8);
}
