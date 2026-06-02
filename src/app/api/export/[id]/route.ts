import { db, schema } from '@/lib/db';
import { and, eq, gte, asc } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Export CSV del reporte de un cliente: snapshots diarios (followers/reach/leads/gasto). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return new Response('unauthorized', { status: 401 });

  const { id } = await params;
  const clientId = Number(id);
  if (!clientId) return new Response('bad id', { status: 400 });

  const url = new URL(req.url);
  const days = Number(url.searchParams.get('days')) || 90;
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);

  const [cliente] = await db.select({ nombre: schema.clients.nombre, slug: schema.clients.slug })
    .from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1);
  if (!cliente) return new Response('not found', { status: 404 });

  const rows = await db.select({
    date: schema.metricSnapshots.date,
    followers: schema.metricSnapshots.followers,
    reach: schema.metricSnapshots.reach,
    impressions: schema.metricSnapshots.impressions,
    profileVisits: schema.metricSnapshots.profileVisits,
    websiteClicks: schema.metricSnapshots.websiteClicks,
    newLeads: schema.metricSnapshots.newLeads,
    adSpend: schema.metricSnapshots.adSpend,
    adResults: schema.metricSnapshots.adResults,
  }).from(schema.metricSnapshots)
    .where(and(eq(schema.metricSnapshots.clientId, clientId), gte(schema.metricSnapshots.date, since)))
    .orderBy(asc(schema.metricSnapshots.date));

  const headers = ['fecha', 'seguidores', 'alcance', 'impresiones', 'visitas_perfil', 'clicks_web', 'leads', 'gasto_ads', 'resultados_ads'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.date, r.followers ?? '', r.reach ?? '', r.impressions ?? '', r.profileVisits ?? '',
      r.websiteClicks ?? '', r.newLeads ?? '', r.adSpend ?? '', r.adResults ?? '',
    ].join(','));
  }
  const csv = '﻿' + lines.join('\n'); // BOM para Excel

  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte_${cliente.slug}_${fecha}.csv"`,
    },
  });
}
