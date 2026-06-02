'use server';
import { db, schema } from '@/lib/db';
import { and, eq, gte, asc } from 'drizzle-orm';
import { ctx } from './_ctx';

/** Trend de snapshots diarios para una ventana de días (default 30). */
export async function listSnapshots(opts: { clientId: number; days?: number }) {
  await ctx();
  const days = opts.days ?? 30;
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  return await db.select({
    date: schema.metricSnapshots.date,
    followers: schema.metricSnapshots.followers,
    reach: schema.metricSnapshots.reach,
    impressions: schema.metricSnapshots.impressions,
    profileVisits: schema.metricSnapshots.profileVisits,
    websiteClicks: schema.metricSnapshots.websiteClicks,
    adSpend: schema.metricSnapshots.adSpend,
    adResults: schema.metricSnapshots.adResults,
    newLeads: schema.metricSnapshots.newLeads,
  }).from(schema.metricSnapshots)
    .where(and(eq(schema.metricSnapshots.clientId, opts.clientId), gte(schema.metricSnapshots.date, since)))
    .orderBy(asc(schema.metricSnapshots.date));
}

/** Resumen: primer vs último snapshot de la ventana → delta % por métrica. */
export async function snapshotsResumen(opts: { clientId: number; days?: number }) {
  const rows = await listSnapshots(opts);
  if (rows.length === 0) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const delta = (a?: number | null, b?: number | null) =>
    a == null || b == null || a === 0 ? null : Math.round(((b - a) / a) * 100);
  return {
    dias: rows.length,
    followers: last.followers,
    followersDelta: delta(first.followers, last.followers),
    reach: rows.reduce((s, r) => s + (r.reach ?? 0), 0),
    leads: rows.reduce((s, r) => s + (r.newLeads ?? 0), 0),
    adSpend: rows.reduce((s, r) => s + Number(r.adSpend ?? 0), 0),
  };
}
