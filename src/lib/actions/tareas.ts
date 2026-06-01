'use server';
import { db, schema } from '@/lib/db';
import { and, eq, desc, asc, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';

export async function listTareas(opts?: { done?: boolean; clientId?: number }) {
  await ctx();
  const conds = [];
  if (opts?.done !== undefined) conds.push(eq(schema.tasks.done, opts.done));
  if (opts?.clientId) conds.push(eq(schema.tasks.clientId, opts.clientId));
  return await db.select({
    id: schema.tasks.id, titulo: schema.tasks.titulo, detalle: schema.tasks.detalle,
    done: schema.tasks.done, dueAt: schema.tasks.dueAt, prioridad: schema.tasks.prioridad,
    categoria: schema.tasks.categoria, clientId: schema.tasks.clientId,
    cliente: schema.clients.nombre, color: schema.clients.color,
  }).from(schema.tasks)
    .leftJoin(schema.clients, eq(schema.tasks.clientId, schema.clients.id))
    .where(and(...conds))
    .orderBy(asc(schema.tasks.done), asc(schema.tasks.dueAt), desc(schema.tasks.createdAt));
}

export async function createTarea(formData: FormData) {
  await ctx();
  const titulo = String(formData.get('titulo') || '').trim();
  if (!titulo) return;
  const clientIdRaw = formData.get('client_id');
  const dueAtRaw = formData.get('due_at');
  await db.insert(schema.tasks).values({
    titulo,
    detalle: (formData.get('detalle') as string) || null,
    clientId: clientIdRaw ? Number(clientIdRaw) || null : null,
    categoria: (formData.get('categoria') as string) || null,
    prioridad: (formData.get('prioridad') as string) || 'media',
    dueAt: dueAtRaw ? new Date(String(dueAtRaw)) : null,
  });
  revalidatePath('/tareas');
}

export async function toggleTarea(id: number) {
  await ctx();
  const [t] = await db.select({ done: schema.tasks.done }).from(schema.tasks).where(eq(schema.tasks.id, id)).limit(1);
  await db.update(schema.tasks).set({ done: !t?.done }).where(eq(schema.tasks.id, id));
  revalidatePath('/tareas');
}

export async function deleteTarea(id: number) {
  await ctx();
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  revalidatePath('/tareas');
}
