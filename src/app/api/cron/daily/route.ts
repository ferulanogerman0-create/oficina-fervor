// Cron diario AGRUPADO: corre todos los syncs en 1 call.
// Configurar en EasyPanel scheduled task o n8n cron:
//   GET https://oficina.wolfdma.website/api/cron/daily?secret=<CRON_SECRET>
// Recomendado: 1x/día 06:00 ART.

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import { snapshotClient, MetaNotConnected } from '@/lib/meta';
import {
  buildEventTimes, createEvent, getActiveAccessToken, habitToRRULE,
} from '@/lib/google/gcal';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    const ok = auth === `Bearer ${secret}` || req.nextUrl.searchParams.get('secret') === secret;
    if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(today + 'T00:00:00.000Z');
  const out: any = { date: today, snapshots: {}, habits: { synced: 0, skipped: 0 }, leadsStuck: 0, propuestasStale: 0 };

  // ============== 1. SNAPSHOTS clientes ==============
  const clients = await db.select({ id: schema.clients.id })
    .from(schema.clients)
    .where(eq(schema.clients.estado, 'activo'));
  for (const c of clients) {
    try {
      await snapshotClient(c.id, today);
      out.snapshots[c.id] = 'meta_ok';
    } catch (e) {
      out.snapshots[c.id] = e instanceof MetaNotConnected ? 'no_meta' : 'meta_err';
    }
    const [leads] = await db.select({ n: sql<number>`count(*)` }).from(schema.leads)
      .where(and(eq(schema.leads.clientId, c.id), gte(schema.leads.createdAt, startOfDay)));
    const [ads] = await db.select({
      spend: sql<number>`coalesce(sum(${schema.adCampaigns.spend}),0)`,
      results: sql<number>`coalesce(sum(${schema.adCampaigns.results}),0)`,
    }).from(schema.adCampaigns).where(eq(schema.adCampaigns.clientId, c.id));
    const [existing] = await db.select().from(schema.metricSnapshots)
      .where(and(eq(schema.metricSnapshots.clientId, c.id), eq(schema.metricSnapshots.date, today))).limit(1);
    if (existing) {
      await db.update(schema.metricSnapshots).set({
        newLeads: Number(leads?.n ?? 0),
        adSpend: ads?.spend?.toString() ?? '0',
        adResults: Number(ads?.results ?? 0),
      }).where(eq(schema.metricSnapshots.id, existing.id));
    } else {
      await db.insert(schema.metricSnapshots).values({
        clientId: c.id, date: today,
        newLeads: Number(leads?.n ?? 0),
        adSpend: ads?.spend?.toString() ?? '0',
        adResults: Number(ads?.results ?? 0),
      });
    }
  }

  // ============== 2. HABIT GCAL SYNC ==============
  const tok = await getActiveAccessToken();
  if (tok) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fecha = tomorrow.toISOString().slice(0, 10);
    const pendientes = await db.select().from(schema.habitos)
      .where(and(eq(schema.habitos.activo, true), isNull(schema.habitos.gcalEventId)));
    for (const h of pendientes) {
      const { start, end } = buildEventTimes(fecha, h.horaDefault, h.tiempoEstimadoMin || 30);
      const recurrence = habitToRRULE(h.frecuencia, h.diasSemana, h.diaMes);
      const ev = await createEvent({
        summary: `${h.emoji || '🔥'} ${h.titulo}`,
        description: h.descripcion || undefined,
        start, end, recurrence, colorId: '6',
      });
      if (ev?.id) {
        await db.update(schema.habitos).set({ gcalEventId: ev.id }).where(eq(schema.habitos.id, h.id));
        out.habits.synced++;
      } else {
        out.habits.skipped++;
      }
    }
  } else {
    out.habits.skipped = 'gcal_not_connected';
  }

  // ============== 3. LEADS STUCK + PROPUESTAS STALE ==============
  // Count leads en nuevo/contactado sin actividad > 48h
  const cutoff48h = new Date(Date.now() - 48 * 3600 * 1000);
  const [stuck] = await db.select({ n: sql<number>`count(*)` }).from(schema.leads)
    .where(and(
      sql`${schema.leads.estado} IN ('nuevo','contactado')`,
      sql`COALESCE(${schema.leads.ultimoContacto}, ${schema.leads.createdAt}) < ${cutoff48h.toISOString()}`,
    ));
  out.leadsStuck = Number(stuck?.n ?? 0);

  // Propuestas enviadas hace > 5 días sin aceptar/rechazar
  const cutoff5d = new Date(Date.now() - 5 * 24 * 3600 * 1000);
  const [stale] = await db.select({ n: sql<number>`count(*)` }).from(schema.propuestas)
    .where(and(
      eq(schema.propuestas.estado, 'enviada'),
      sql`${schema.propuestas.sentAt} < ${cutoff5d.toISOString()}`,
    ));
  out.propuestasStale = Number(stale?.n ?? 0);

  out.ok = true;
  return NextResponse.json(out);
}
