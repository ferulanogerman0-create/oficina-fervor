'use server';
import { db, schema } from '@/lib/db';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { buildEventTimes, createEvent, deleteEvent, getActiveAccessToken, habitToRRULE } from '@/lib/google/gcal';

// ===================== HABITOS =====================

export async function createHabito(input: {
  titulo: string;
  descripcion?: string;
  categoria: string;
  frecuencia: 'diaria' | 'semanal' | 'mensual';
  diasSemana?: string;
  diaMes?: number;
  horaDefault?: string;
  tiempoEstimadoMin?: number;
  objetivoId?: number;
  emoji?: string;
  color?: string;
  syncGcal?: boolean;
}) {
  const tiempoEst = input.tiempoEstimadoMin ?? 30;
  const [created] = await db.insert(schema.habitos).values({
    titulo: input.titulo,
    descripcion: input.descripcion,
    categoria: input.categoria,
    frecuencia: input.frecuencia,
    diasSemana: input.diasSemana,
    diaMes: input.diaMes,
    horaDefault: input.horaDefault || '09:00',
    tiempoEstimadoMin: tiempoEst,
    objetivoId: input.objetivoId,
    emoji: input.emoji,
    color: input.color || '#FF5A1F',
    activo: true,
  }).returning();

  if (input.syncGcal !== false) {
    // Crear recurring event en GCal desde mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fecha = tomorrow.toISOString().slice(0, 10);
    const { start, end } = buildEventTimes(fecha, input.horaDefault || '09:00', tiempoEst);
    const recurrence = habitToRRULE(input.frecuencia, input.diasSemana, input.diaMes);
    const ev = await createEvent({
      summary: `${input.emoji || '🔥'} ${input.titulo}`,
      description: input.descripcion,
      start, end,
      recurrence,
      colorId: '6',
    });
    if (ev?.id) {
      await db.update(schema.habitos).set({ gcalEventId: ev.id }).where(eq(schema.habitos.id, created.id));
    }
  }
  revalidatePath('/habitos');
  return created;
}

// Backfill: crea eventos en GCal para hábitos/tareas que ya existían antes de
// conectar Calendar (sin gcalEventId). Hábitos = recurrentes desde HOY.
export async function syncPendingToGcal(): Promise<{ ok: boolean; habitos: number; tareas: number; error?: string }> {
  const token = await getActiveAccessToken();
  if (!token) return { ok: false, habitos: 0, tareas: 0, error: 'gcal_no_conectado' };

  let hCount = 0, tCount = 0;
  const hoy = new Date().toISOString().slice(0, 10);

  // Hábitos activos sin evento → recurrente desde hoy
  const habs = await db.select().from(schema.habitos)
    .where(and(eq(schema.habitos.activo, true), sql`${schema.habitos.gcalEventId} is null`));
  for (const h of habs) {
    const { start, end } = buildEventTimes(hoy, h.horaDefault, h.tiempoEstimadoMin || 30);
    const recurrence = habitToRRULE(h.frecuencia, h.diasSemana, h.diaMes);
    const ev = await createEvent({
      summary: `${h.emoji || '🔥'} ${h.titulo}`,
      description: h.descripcion || undefined,
      start, end, recurrence, colorId: '6',
    });
    if (ev?.id) { await db.update(schema.habitos).set({ gcalEventId: ev.id }).where(eq(schema.habitos.id, h.id)); hCount++; }
  }

  // Tareas pendientes con vencimiento sin evento → one-off (best-effort)
  try {
    const tks = await db.select().from(schema.tasks)
      .where(and(eq(schema.tasks.done, false), sql`${(schema.tasks as any).gcalEventId} is null`, sql`${schema.tasks.dueAt} is not null`));
    for (const t of tks) {
      const due = new Date(t.dueAt as any);
      const fecha = due.toISOString().slice(0, 10);
      const hora = due.toISOString().slice(11, 16);
      const { start, end } = buildEventTimes(fecha, hora, 30);
      const ev = await createEvent({ summary: `📌 ${t.titulo}`, description: (t as any).detalle || undefined, start, end, colorId: '5' });
      if (ev?.id) { await db.update(schema.tasks).set({ gcalEventId: ev.id } as any).where(eq(schema.tasks.id, t.id)); tCount++; }
    }
  } catch { /* columna gcal_event_id en tasks puede no existir; ignorar */ }

  revalidatePath('/habitos');
  return { ok: true, habitos: hCount, tareas: tCount };
}

export async function toggleHabitoActivo(id: number) {
  const [h] = await db.select().from(schema.habitos).where(eq(schema.habitos.id, id)).limit(1);
  if (!h) return;
  await db.update(schema.habitos).set({ activo: !h.activo }).where(eq(schema.habitos.id, id));
  revalidatePath('/habitos');
}

export async function deleteHabito(id: number) {
  const [h] = await db.select().from(schema.habitos).where(eq(schema.habitos.id, id)).limit(1);
  if (h?.gcalEventId) await deleteEvent(h.gcalEventId);
  await db.delete(schema.habitos).where(eq(schema.habitos.id, id));
  revalidatePath('/habitos');
}

// ===================== COMPLETIONS =====================

export async function toggleCompletion(habitoId: number, fecha: string) {
  const [existing] = await db.select().from(schema.habitoCompletions)
    .where(and(eq(schema.habitoCompletions.habitoId, habitoId), eq(schema.habitoCompletions.fecha, fecha)))
    .limit(1);
  if (existing) {
    await db.update(schema.habitoCompletions)
      .set({ completado: !existing.completado })
      .where(eq(schema.habitoCompletions.id, existing.id));
  } else {
    await db.insert(schema.habitoCompletions).values({ habitoId, fecha, completado: true });
  }
  revalidatePath('/habitos');
  revalidatePath('/');
}

export async function setNotasCompletion(habitoId: number, fecha: string, notas: string, tiempoRealMin?: number) {
  const [existing] = await db.select().from(schema.habitoCompletions)
    .where(and(eq(schema.habitoCompletions.habitoId, habitoId), eq(schema.habitoCompletions.fecha, fecha)))
    .limit(1);
  if (existing) {
    await db.update(schema.habitoCompletions)
      .set({ notas, tiempoRealMin: tiempoRealMin ?? existing.tiempoRealMin })
      .where(eq(schema.habitoCompletions.id, existing.id));
  } else {
    await db.insert(schema.habitoCompletions).values({ habitoId, fecha, completado: false, notas, tiempoRealMin });
  }
  revalidatePath('/habitos');
}

// ===================== QUERIES =====================

export async function getHabitosHoy(fecha: string) {
  const dow = String(new Date(fecha + 'T12:00:00').getDay());
  const dia = new Date(fecha + 'T12:00:00').getDate();
  const all = await db.select().from(schema.habitos).where(eq(schema.habitos.activo, true)).orderBy(schema.habitos.horaDefault);
  const aplican = all.filter((h) => {
    if (h.frecuencia === 'diaria') {
      return !h.diasSemana || h.diasSemana.split(',').map((d) => d.trim()).includes(dow);
    }
    if (h.frecuencia === 'semanal') {
      return h.diasSemana?.trim() === dow;
    }
    if (h.frecuencia === 'mensual') {
      return h.diaMes === dia;
    }
    return false;
  });
  const compl = await db.select().from(schema.habitoCompletions).where(eq(schema.habitoCompletions.fecha, fecha));
  const map = new Map(compl.map((c) => [c.habitoId, c]));
  return aplican.map((h) => ({
    ...h,
    completion: map.get(h.id) || null,
  }));
}

export async function getStreak(habitoId: number): Promise<number> {
  const rows = await db.select().from(schema.habitoCompletions)
    .where(and(eq(schema.habitoCompletions.habitoId, habitoId), eq(schema.habitoCompletions.completado, true)))
    .orderBy(desc(schema.habitoCompletions.fecha));
  if (!rows.length) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const fechas = new Set(rows.map((r) => r.fecha));
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const f = d.toISOString().slice(0, 10);
    if (fechas.has(f)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export async function getHeatmap(habitoId: number, days = 90) {
  const today = new Date();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await db.select().from(schema.habitoCompletions)
    .where(and(
      eq(schema.habitoCompletions.habitoId, habitoId),
      gte(schema.habitoCompletions.fecha, since.toISOString().slice(0, 10)),
      lte(schema.habitoCompletions.fecha, today.toISOString().slice(0, 10)),
    ));
  return rows;
}

// ===================== OBJETIVOS =====================

export async function createObjetivo(input: {
  titulo: string;
  descripcion?: string;
  tipo: '90d' | 'mensual' | 'semanal' | 'anual';
  categoria?: string;
  fechaInicio: string;
  fechaFin: string;
  kpiUnidad?: string;
  kpiTarget?: string;
  color?: string;
}) {
  const [created] = await db.insert(schema.objetivos).values({
    ...input,
    color: input.color || '#FF5A1F',
  } as any).returning();
  revalidatePath('/objetivos');
  return created;
}

export async function updateObjetivoActual(id: number, kpiActual: string) {
  await db.update(schema.objetivos)
    .set({ kpiActual, updatedAt: new Date() as any })
    .where(eq(schema.objetivos.id, id));
  revalidatePath('/objetivos');
}

export async function getObjetivosActivos() {
  return await db.select().from(schema.objetivos)
    .where(eq(schema.objetivos.estado, 'activo'))
    .orderBy(schema.objetivos.fechaFin);
}

export async function changeObjetivoEstado(id: number, estado: string) {
  await db.update(schema.objetivos).set({ estado, updatedAt: new Date() as any }).where(eq(schema.objetivos.id, id));
  revalidatePath('/objetivos');
}

// ===================== TAREAS =====================

export async function createTarea(input: {
  titulo: string;
  detalle?: string;
  categoria?: string;
  prioridad?: string;
  dueAt?: string;
  objetivoId?: number;
  syncGcal?: boolean;
}) {
  const dueDate = input.dueAt ? new Date(input.dueAt) : null;
  const [created] = await db.insert(schema.tasks).values({
    titulo: input.titulo,
    detalle: input.detalle,
    categoria: input.categoria,
    prioridad: input.prioridad || 'media',
    dueAt: dueDate as any,
    objetivoId: input.objetivoId,
    tipo: 'one_off',
  } as any).returning();
  if (input.syncGcal !== false && dueDate) {
    const fecha = dueDate.toISOString().slice(0, 10);
    const hora = dueDate.toISOString().slice(11, 16);
    const { start, end } = buildEventTimes(fecha, hora, 30);
    const ev = await createEvent({
      summary: `📌 ${input.titulo}`,
      description: input.detalle,
      start, end,
      colorId: '5',
    });
    if (ev?.id) await db.update(schema.tasks).set({ gcalEventId: ev.id } as any).where(eq(schema.tasks.id, created.id));
  }
  revalidatePath('/tareas');
  return created;
}

export async function toggleTareaDone(id: number) {
  const [t] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).limit(1);
  if (!t) return;
  await db.update(schema.tasks).set({ done: !t.done }).where(eq(schema.tasks.id, id));
  revalidatePath('/tareas');
}

export async function deleteTarea(id: number) {
  const [t] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).limit(1);
  if ((t as any)?.gcalEventId) await deleteEvent((t as any).gcalEventId);
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  revalidatePath('/tareas');
}

// ===================== DASHBOARD =====================

export async function getDashboardStats() {
  const hoy = new Date().toISOString().slice(0, 10);
  const habitosHoy = await getHabitosHoy(hoy);
  const completadosHoy = habitosHoy.filter((h) => h.completion?.completado).length;
  const totalHoy = habitosHoy.length;
  const objetivos = await getObjetivosActivos();
  const tareasPend = await db.select({ count: sql<number>`count(*)::int` }).from(schema.tasks).where(eq(schema.tasks.done, false));
  return {
    habitosHoy: { completados: completadosHoy, total: totalHoy, pct: totalHoy ? Math.round((completadosHoy / totalHoy) * 100) : 0 },
    objetivosActivos: objetivos.length,
    tareasPendientes: tareasPend[0]?.count ?? 0,
  };
}
