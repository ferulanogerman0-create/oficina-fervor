'use server';
import { db, schema } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
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

export async function getPropuestaByToken(token: string) {
  const [row] = await db.select().from(schema.propuestas).where(eq(schema.propuestas.publicToken, token)).limit(1);
  return row ?? null;
}

export async function ensurePublicToken(id: number) {
  const p = await getPropuesta(id);
  if (!p) throw new Error('not_found');
  if (p.publicToken) return p.publicToken;
  const token = randomBytes(18).toString('base64url');
  await db.update(schema.propuestas).set({ publicToken: token, updatedAt: new Date() as any }).where(eq(schema.propuestas.id, id));
  revalidatePath(`/propuestas/${id}/preview`);
  return token;
}

export async function bumpView(id: number) {
  await db.update(schema.propuestas)
    .set({
      viewCount: sql`${schema.propuestas.viewCount} + 1`,
      viewedAt: new Date() as any,
    })
    .where(eq(schema.propuestas.id, id));
}

export async function sendPropuestaMail(id: number, baseUrl: string) {
  const { sendMail } = await import('@/lib/mail/resend');
  const p = await getPropuesta(id);
  if (!p) throw new Error('not_found');
  if (!p.clientEmail) throw new Error('cliente sin email');
  const token = await ensurePublicToken(id);
  const url = `${baseUrl.replace(/\/$/, '')}/p/${token}`;
  const setupFmt = p.currency === 'USD' ? `USD ${Number(p.setupTotal).toLocaleString('en-US')}` : `$${Number(p.setupTotal).toLocaleString('es-AR')}`;
  const mrrFmt = p.currency === 'USD' ? `USD ${Number(p.mrrTotal).toLocaleString('en-US')}/mes` : `$${Number(p.mrrTotal).toLocaleString('es-AR')}/mes`;

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0A0A0A;color:#FAFAFA;padding:40px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #222;padding:32px">
    <div style="font-size:32px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;color:#FF5A1F">FERVOR<span style="color:#fff">®</span></div>
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#FF5A1F;margin-top:24px">Propuesta comercial</div>
    <h1 style="font-size:32px;margin:8px 0 24px;text-transform:uppercase">Hola ${escapeHtml(p.clientName)}</h1>
    <p style="line-height:1.6;opacity:.9">Como te comenté, te paso la propuesta que armé para <strong>${escapeHtml(p.clientNegocio || 'tu negocio')}</strong>. Está al detalle: servicios, alcance, plazos, precio.</p>
    <div style="margin:24px 0;padding:20px;background:#0A0A0A;border-left:4px solid #FF5A1F">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#FF5A1F">Resumen rápido</div>
      <div style="font-size:14px;margin-top:8px">Setup: <strong style="color:#FF5A1F">${setupFmt}</strong></div>
      <div style="font-size:14px">Mensual: <strong style="color:#FF5A1F">${mrrFmt}</strong></div>
      <div style="font-size:11px;color:#9a9a9a;margin-top:8px">Validez: ${p.validityDays} días</div>
    </div>
    <a href="${url}" style="display:inline-block;background:#FF5A1F;color:#fff;padding:16px 32px;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;font-size:14px;margin:8px 0">Ver propuesta completa →</a>
    <p style="line-height:1.6;opacity:.8;margin-top:24px;font-size:13px">Si tenés dudas o querés ajustar algo, respondeme este mail directamente. Si te gusta, hacé click en "Acepto la propuesta" al final y arrancamos.</p>
    <p style="margin-top:24px">Saludos,<br><strong>Germán</strong><br><span style="font-size:12px;color:#9a9a9a">FERVOR · wolfdma.website</span></p>
  </div>
</body></html>`;
  const text = `Hola ${p.clientName},\n\nTe paso la propuesta para ${p.clientNegocio || 'tu negocio'}.\n\nSetup: ${setupFmt}\nMensual: ${mrrFmt}\nValidez: ${p.validityDays} días\n\nLink: ${url}\n\nSi querés ajustar algo respondeme directo. Si te gusta hacé click en "Acepto la propuesta" al final.\n\nGermán · FERVOR\nwolfdma.website`;
  const replyTo = process.env.RESEND_REPLY_TO || 'wolfdmagency@gmail.com';

  const r = await sendMail({
    to: p.clientEmail,
    subject: `Propuesta FERVOR para ${p.clientName}`,
    html, text, replyTo,
    bcc: replyTo, // copia para Germán
  });

  await db.update(schema.propuestas)
    .set({ estado: 'enviada', sentAt: new Date() as any, updatedAt: new Date() as any })
    .where(eq(schema.propuestas.id, id));
  revalidatePath(`/propuestas`);
  revalidatePath(`/propuestas/${id}/preview`);
  return { mailId: r.id, url };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function aceptarPorToken(token: string) {
  const p = await getPropuestaByToken(token);
  if (!p) throw new Error('not_found');
  if (p.estado !== 'aceptada') {
    await db.update(schema.propuestas)
      .set({ estado: 'aceptada', acceptedAt: new Date() as any, updatedAt: new Date() as any })
      .where(eq(schema.propuestas.id, p.id));
  }
  revalidatePath(`/p/${token}`);
  revalidatePath('/propuestas');
}
