// Cron diario: garantiza que los hábitos sin gcalEventId tengan evento creado
// Se llama desde EasyPanel cron / GH actions / curl externo.
// Auth: ?secret=<CRON_SECRET>

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, isNull, and } from 'drizzle-orm';
import { buildEventTimes, createEvent, getActiveAccessToken, habitToRRULE } from '@/lib/google/gcal';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams.get('secret');
  if (s !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const token = await getActiveAccessToken();
  if (!token) return NextResponse.json({ ok: false, error: 'gcal not connected' });

  const pendientes = await db.select().from(schema.habitos)
    .where(and(eq(schema.habitos.activo, true), isNull(schema.habitos.gcalEventId)));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fecha = tomorrow.toISOString().slice(0, 10);

  const results: any[] = [];
  for (const h of pendientes) {
    const { start, end } = buildEventTimes(fecha, h.horaDefault, h.tiempoEstimadoMin || 30);
    const recurrence = habitToRRULE(h.frecuencia, h.diasSemana, h.diaMes);
    const ev = await createEvent({
      summary: `${h.emoji || '🔥'} ${h.titulo}`,
      description: h.descripcion || undefined,
      start, end,
      recurrence,
      colorId: '6',
    });
    if (ev?.id) {
      await db.update(schema.habitos).set({ gcalEventId: ev.id }).where(eq(schema.habitos.id, h.id));
      results.push({ id: h.id, evento: ev.id, ok: true });
    } else {
      results.push({ id: h.id, ok: false });
    }
  }
  return NextResponse.json({ ok: true, sincronizados: results.length, results });
}
