'use server';
import { db, schema } from '@/lib/db';
import { and, eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import type { EtapaLead } from '@/lib/types';

export async function listLeads(opts?: { clientId?: number }) {
  await ctx();
  const conds = opts?.clientId ? [eq(schema.leads.clientId, opts.clientId)] : [];
  return await db.select({
    id: schema.leads.id, nombre: schema.leads.nombre, telefono: schema.leads.telefono,
    email: schema.leads.email, fuente: schema.leads.fuente, estado: schema.leads.estado,
    motivo: schema.leads.motivo, notas: schema.leads.notas,
    ultimoContacto: schema.leads.ultimoContacto, proximoFollowup: schema.leads.proximoFollowup,
    createdAt: schema.leads.createdAt, clientId: schema.leads.clientId,
    cliente: schema.clients.nombre, color: schema.clients.color,
  }).from(schema.leads)
    .leftJoin(schema.clients, eq(schema.leads.clientId, schema.clients.id))
    .where(and(...conds))
    .orderBy(desc(schema.leads.createdAt));
}

export async function createLead(formData: FormData) {
  await ctx();
  const nombre = String(formData.get('nombre') || '').trim();
  const clientId = Number(formData.get('client_id'));
  if (!nombre || !clientId) return;
  await db.insert(schema.leads).values({
    clientId, nombre,
    telefono: (formData.get('telefono') as string) || null,
    email: (formData.get('email') as string) || null,
    fuente: (formData.get('fuente') as string) || null,
    motivo: (formData.get('motivo') as string) || null,
    notas: (formData.get('notas') as string) || null,
    estado: (formData.get('estado') as string) || 'nuevo',
  });
  revalidatePath('/crm');
}

export async function moveLead(id: number, estado: EtapaLead) {
  await ctx();
  await db.update(schema.leads).set({ estado, ultimoContacto: new Date() }).where(eq(schema.leads.id, id));
  revalidatePath('/crm');
}

export async function deleteLead(id: number) {
  await ctx();
  await db.delete(schema.leads).where(eq(schema.leads.id, id));
  revalidatePath('/crm');
}
