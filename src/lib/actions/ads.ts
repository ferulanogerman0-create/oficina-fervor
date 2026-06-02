'use server';
import { db, schema } from '@/lib/db';
import { and, eq, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import { syncCampaigns, MetaNotConnected } from '@/lib/meta';

export async function listCampaigns(opts?: { clientId?: number }) {
  await ctx();
  const conds = opts?.clientId ? [eq(schema.adCampaigns.clientId, opts.clientId)] : [];
  return await db.select({
    id: schema.adCampaigns.id, metaId: schema.adCampaigns.metaId, name: schema.adCampaigns.name,
    objective: schema.adCampaigns.objective, status: schema.adCampaigns.status,
    dailyBudget: schema.adCampaigns.dailyBudget, spend: schema.adCampaigns.spend,
    impressions: schema.adCampaigns.impressions, clicks: schema.adCampaigns.clicks,
    ctr: schema.adCampaigns.ctr, results: schema.adCampaigns.results,
    costPerResult: schema.adCampaigns.costPerResult, startTime: schema.adCampaigns.startTime,
    syncedAt: schema.adCampaigns.syncedAt,
    clientId: schema.adCampaigns.clientId, cliente: schema.clients.nombre, color: schema.clients.color,
  }).from(schema.adCampaigns)
    .leftJoin(schema.clients, eq(schema.adCampaigns.clientId, schema.clients.id))
    .where(and(...conds))
    .orderBy(desc(schema.adCampaigns.spend));
}

export async function adsKpis(opts?: { clientId?: number }) {
  await ctx();
  const conds = opts?.clientId ? [eq(schema.adCampaigns.clientId, opts.clientId)] : [];
  const [row] = await db.select({
    spend: sql<number>`coalesce(sum(${schema.adCampaigns.spend}),0)`,
    impressions: sql<number>`coalesce(sum(${schema.adCampaigns.impressions}),0)`,
    clicks: sql<number>`coalesce(sum(${schema.adCampaigns.clicks}),0)`,
    results: sql<number>`coalesce(sum(${schema.adCampaigns.results}),0)`,
    activas: sql<number>`count(*) filter (where ${schema.adCampaigns.status} = 'ACTIVE')`,
    total: sql<number>`count(*)`,
  }).from(schema.adCampaigns).where(and(...conds));
  return row;
}

export async function syncAds(clientId: number) {
  await ctx();
  try {
    const n = await syncCampaigns(clientId);
    revalidatePath('/ads');
    return { ok: true as const, count: n };
  } catch (e) {
    if (e instanceof MetaNotConnected) return { ok: false as const, error: 'no_meta' };
    return { ok: false as const, error: e instanceof Error ? e.message : 'sync_failed' };
  }
}
