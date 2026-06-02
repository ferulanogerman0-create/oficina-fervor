import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { snapshotClient, MetaNotConnected } from '@/lib/meta';

export const dynamic = 'force-dynamic';

/**
 * Cron diario: arma el snapshot del día por cada cliente activo.
 * - Trae account insights de Meta (si la cuenta está conectada).
 * - Completa newLeads + adSpend/adResults desde tablas locales.
 * Proteger con CRON_SECRET (header Authorization: Bearer o ?secret=).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const auth = req.headers.get('authorization');
    const ok = auth === `Bearer ${secret}` || url.searchParams.get('secret') === secret;
    if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(today + 'T00:00:00.000Z');
  const clients = await db.select({ id: schema.clients.id }).from(schema.clients)
    .where(eq(schema.clients.estado, 'activo'));

  const results: Record<string, string> = {};
  for (const c of clients) {
    // 1) intentar insights de Meta (best-effort)
    try {
      await snapshotClient(c.id, today);
      results[c.id] = 'meta_ok';
    } catch (e) {
      results[c.id] = e instanceof MetaNotConnected ? 'no_meta' : 'meta_err';
    }
    // 2) completar métricas locales (leads del día + gasto/result de campañas)
    const [leads] = await db.select({ n: sql<number>`count(*)` }).from(schema.leads)
      .where(and(eq(schema.leads.clientId, c.id), gte(schema.leads.createdAt, startOfDay)));
    const [ads] = await db.select({
      spend: sql<number>`coalesce(sum(${schema.adCampaigns.spend}),0)`,
      results: sql<number>`coalesce(sum(${schema.adCampaigns.results}),0)`,
    }).from(schema.adCampaigns).where(eq(schema.adCampaigns.clientId, c.id));

    await db.insert(schema.metricSnapshots).values({
      clientId: c.id, date: today,
      newLeads: Number(leads.n) || 0,
      adSpend: String(Number(ads.spend) || 0),
      adResults: Number(ads.results) || 0,
    }).onConflictDoUpdate({
      target: [schema.metricSnapshots.clientId, schema.metricSnapshots.date],
      set: {
        newLeads: Number(leads.n) || 0,
        adSpend: String(Number(ads.spend) || 0),
        adResults: Number(ads.results) || 0,
      },
    });
  }

  return NextResponse.json({ ok: true, date: today, clients: clients.length, results });
}
