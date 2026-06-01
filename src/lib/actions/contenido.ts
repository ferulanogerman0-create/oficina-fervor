'use server';
import { db, schema } from '@/lib/db';
import { and, eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import type { EstadoIdea } from '@/lib/types';

export async function listIdeas(opts?: { clientId?: number }) {
  await ctx();
  const conds = opts?.clientId ? [eq(schema.contentIdeas.clientId, opts.clientId)] : [];
  return await db.select({
    id: schema.contentIdeas.id, titulo: schema.contentIdeas.titulo,
    formato: schema.contentIdeas.formato, hook: schema.contentIdeas.hook,
    notas: schema.contentIdeas.notas, estado: schema.contentIdeas.estado,
    plannedFor: schema.contentIdeas.plannedFor, postedAt: schema.contentIdeas.postedAt,
    clientId: schema.contentIdeas.clientId,
    cliente: schema.clients.nombre, color: schema.clients.color,
  }).from(schema.contentIdeas)
    .leftJoin(schema.clients, eq(schema.contentIdeas.clientId, schema.clients.id))
    .where(and(...conds))
    .orderBy(desc(schema.contentIdeas.createdAt));
}

export async function createIdea(formData: FormData) {
  await ctx();
  const titulo = String(formData.get('titulo') || '').trim();
  const clientId = Number(formData.get('client_id'));
  if (!titulo || !clientId) return;
  await db.insert(schema.contentIdeas).values({
    clientId, titulo,
    formato: (formData.get('formato') as string) || 'carrusel',
    hook: (formData.get('hook') as string) || null,
    notas: (formData.get('notas') as string) || null,
    estado: 'idea',
  });
  revalidatePath('/contenido');
}

export async function moveIdea(id: number, estado: EstadoIdea) {
  await ctx();
  const set: Record<string, unknown> = { estado };
  if (estado === 'posteado') set.postedAt = new Date();
  await db.update(schema.contentIdeas).set(set).where(eq(schema.contentIdeas.id, id));
  revalidatePath('/contenido');
}

export async function deleteIdea(id: number) {
  await ctx();
  await db.delete(schema.contentIdeas).where(eq(schema.contentIdeas.id, id));
  revalidatePath('/contenido');
}
