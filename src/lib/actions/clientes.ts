'use server';
import { db, schema } from '@/lib/db';
import { eq, ilike, or, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx } from './_ctx';

export async function listClientes(query?: string) {
  await ctx();
  const conds = query
    ? [or(ilike(schema.clients.nombre, `%${query}%`), ilike(schema.clients.slug, `%${query}%`))!]
    : [];
  return await db.select().from(schema.clients).where(and(...conds)).orderBy(desc(schema.clients.createdAt));
}

export async function getCliente(id: number) {
  await ctx();
  const [row] = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
  return row ?? null;
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

export async function createCliente(formData: FormData) {
  await ctx();
  const nombre = String(formData.get('nombre') || '').trim();
  if (!nombre) throw new Error('Nombre requerido');
  const slug = String(formData.get('slug') || slugify(nombre));
  const [row] = await db.insert(schema.clients).values({
    slug,
    nombre,
    rubro: (formData.get('rubro') as string) || null,
    color: (formData.get('color') as string) || null,
    igHandle: (formData.get('ig_handle') as string) || null,
    fbPageUrl: (formData.get('fb_page_url') as string) || null,
    whatsapp: (formData.get('whatsapp') as string) || null,
    prioridad: (formData.get('prioridad') as string) || 'media',
    estado: (formData.get('estado') as string) || 'activo',
    notes: (formData.get('notes') as string) || null,
  }).returning({ id: schema.clients.id });
  revalidatePath('/clientes');
  redirect(`/clientes/${row.id}`);
}

export async function updateCliente(id: number, formData: FormData) {
  await ctx();
  await db.update(schema.clients).set({
    nombre: String(formData.get('nombre') || '').trim(),
    rubro: (formData.get('rubro') as string) || null,
    color: (formData.get('color') as string) || null,
    igHandle: (formData.get('ig_handle') as string) || null,
    fbPageUrl: (formData.get('fb_page_url') as string) || null,
    whatsapp: (formData.get('whatsapp') as string) || null,
    prioridad: (formData.get('prioridad') as string) || 'media',
    estado: (formData.get('estado') as string) || 'activo',
    notes: (formData.get('notes') as string) || null,
  }).where(eq(schema.clients.id, id));
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function deleteCliente(id: number) {
  await ctx();
  await db.delete(schema.clients).where(eq(schema.clients.id, id));
  revalidatePath('/clientes');
  redirect('/clientes');
}
