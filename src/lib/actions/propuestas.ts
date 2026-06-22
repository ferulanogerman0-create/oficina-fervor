'use server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServicio, totalesFrom, type LineaSeleccionada } from '@/lib/propuestas/catalog';

export async function listPropuestas() {
  return db.select().from(schema.propuestas).orderBy(desc(schema.propuestas.createdAt));
}

export async function getPropuesta(id: number) {
  const [row] = await db.select().from(schema.propuestas).where(eq(schema.propuestas.id, id)).limit(1);
  return row ?? null;
}

export async function createPropuesta(fd: FormData) {
  const clientName = String(fd.get('client_name') || '').trim();
  if (!clientName) throw new Error('client_name required');

  const clientEmail = String(fd.get('client_email') || '').trim() || null;
  const clientNegocio = String(fd.get('client_negocio') || '').trim() || null;
  const currency = String(fd.get('currency') || 'USD');
  const validityDays = Number(fd.get('validity_days') || 7);
  const notasInternas = String(fd.get('notas_internas') || '').trim() || null;

  // lineas vienen como ítems serializados: key__setup__mrr (uno por servicio seleccionado)
  const lineas: LineaSeleccionada[] = [];
  const keys = fd.getAll('servicio_key') as string[];
  const setups = fd.getAll('servicio_setup') as string[];
  const mrrs = fd.getAll('servicio_mrr') as string[];
  for (let i = 0; i < keys.length; i++) {
    const svc = getServicio(keys[i]);
    if (!svc) continue;
    lineas.push({
      key: svc.key,
      label: svc.label,
      descripcion: svc.descripcion,
      setup: Number(setups[i] || 0),
      mrr: Number(mrrs[i] || 0),
    });
  }
  if (!lineas.length) throw new Error('al menos 1 servicio requerido');

  const { setupTotal, mrrTotal } = totalesFrom(lineas);

  const [created] = await db.insert(schema.propuestas).values({
    clientName,
    clientEmail: clientEmail || undefined,
    clientNegocio: clientNegocio || undefined,
    servicios: lineas as any,
    setupTotal: setupTotal.toString(),
    mrrTotal: mrrTotal.toString(),
    currency,
    validityDays,
    notasInternas: notasInternas || undefined,
    estado: 'borrador',
  }).returning({ id: schema.propuestas.id });

  revalidatePath('/propuestas');
  redirect(`/propuestas/${created.id}/preview`);
}

export async function marcarEnviada(id: number) {
  await db.update(schema.propuestas)
    .set({ estado: 'enviada', sentAt: new Date() as any, updatedAt: new Date() as any })
    .where(eq(schema.propuestas.id, id));
  revalidatePath('/propuestas');
  revalidatePath(`/propuestas/${id}`);
}

export async function marcarAceptada(id: number) {
  await db.update(schema.propuestas)
    .set({ estado: 'aceptada', acceptedAt: new Date() as any, updatedAt: new Date() as any })
    .where(eq(schema.propuestas.id, id));
  revalidatePath('/propuestas');
  revalidatePath(`/propuestas/${id}`);
}

export async function marcarRechazada(id: number) {
  await db.update(schema.propuestas)
    .set({ estado: 'rechazada', updatedAt: new Date() as any })
    .where(eq(schema.propuestas.id, id));
  revalidatePath('/propuestas');
}

export async function deletePropuesta(id: number) {
  await db.delete(schema.propuestas).where(eq(schema.propuestas.id, id));
  revalidatePath('/propuestas');
}
