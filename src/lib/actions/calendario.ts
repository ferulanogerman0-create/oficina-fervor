'use server';
import { db, schema } from '@/lib/db';
import { and, eq, gte, lt, isNull, isNotNull, or, inArray, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';

/** Items programados (plannedFor seteado) dentro de un mes. */
export async function getMonthItems(year: number, month0: number) {
  await ctx();
  const start = new Date(Date.UTC(year, month0, 1));
  const end = new Date(Date.UTC(year, month0 + 1, 1));
  return await db.select({
    id: schema.contentIdeas.id, titulo: schema.contentIdeas.titulo,
    formato: schema.contentIdeas.formato, plataforma: schema.contentIdeas.plataforma,
    estado: schema.contentIdeas.estado, hook: schema.contentIdeas.hook,
    plannedFor: schema.contentIdeas.plannedFor,
    cliente: schema.clients.nombre, color: schema.clients.color,
  }).from(schema.contentIdeas)
    .leftJoin(schema.clients, eq(schema.contentIdeas.clientId, schema.clients.id))
    .where(and(isNotNull(schema.contentIdeas.plannedFor),
      gte(schema.contentIdeas.plannedFor, start), lt(schema.contentIdeas.plannedFor, end)))
    .orderBy(schema.contentIdeas.plannedFor);
}

/** Ideas listas para programar (producción/aprobado, sin fecha). */
export async function getUnscheduled() {
  await ctx();
  return await db.select({
    id: schema.contentIdeas.id, titulo: schema.contentIdeas.titulo,
    formato: schema.contentIdeas.formato, plataforma: schema.contentIdeas.plataforma,
    estado: schema.contentIdeas.estado,
    cliente: schema.clients.nombre, color: schema.clients.color,
  }).from(schema.contentIdeas)
    .leftJoin(schema.clients, eq(schema.contentIdeas.clientId, schema.clients.id))
    .where(and(isNull(schema.contentIdeas.plannedFor),
      inArray(schema.contentIdeas.estado, ['idea', 'produccion', 'aprobado'])))
    .orderBy(desc(schema.contentIdeas.createdAt))
    .limit(30);
}

export async function getIdea(id: number) {
  await ctx();
  const [row] = await db.select().from(schema.contentIdeas).where(eq(schema.contentIdeas.id, id)).limit(1);
  return row ?? null;
}

/** Programar (o reprogramar) una idea: fecha YYYY-MM-DD + hora HH:MM. */
export async function programarIdea(formData: FormData) {
  await ctx();
  const id = Number(formData.get('id'));
  const fecha = String(formData.get('fecha') || '');
  const hora = String(formData.get('hora') || '10:00');
  const plataforma = (formData.get('plataforma') as string) || null;
  if (!id || !fecha) return;
  const planned = new Date(`${fecha}T${hora}:00`);
  await db.update(schema.contentIdeas)
    .set({ plannedFor: planned, ...(plataforma ? { plataforma } : {}) })
    .where(eq(schema.contentIdeas.id, id));
  revalidatePath('/tablero/calendario');
}

export async function desprogramarIdea(id: number) {
  await ctx();
  await db.update(schema.contentIdeas).set({ plannedFor: null }).where(eq(schema.contentIdeas.id, id));
  revalidatePath('/tablero/calendario');
}

export async function guardarGuion(formData: FormData) {
  await ctx();
  const id = Number(formData.get('id'));
  const guion = String(formData.get('guion') || '');
  if (!id) return;
  await db.update(schema.contentIdeas).set({ guion }).where(eq(schema.contentIdeas.id, id));
  revalidatePath('/tablero/calendario');
}
