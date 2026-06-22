// Lead capture público — recibe POST desde wolfdma.website/caso-fma + IG forms
// Auth: ninguna (público CORS). Validación básica + insert en leads del cliente FERVOR esPropio.
//
// POST body JSON o form-encoded:
// {
//   nombre, negocio, contacto (email|tel|whatsapp), problema, source?, utm_source?, utm_medium?, utm_campaign?, ad_id?, post_id?
// }
// Response: { ok: true, id: <leadId> }

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      body = await req.json();
    } else {
      const fd = await req.formData();
      fd.forEach((v, k) => (body[k] = String(v)));
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_body' }, { status: 400, headers: CORS_HEADERS });
  }

  const nombre = String(body.nombre || body.name || '').trim().slice(0, 128);
  const negocio = String(body.negocio || body.business || '').trim().slice(0, 256);
  const contacto = String(body.contacto || body.email || body.phone || body.tel || '').trim().slice(0, 128);
  const problema = String(body.problema || body.message || body.notas || '').trim().slice(0, 2000);

  if (!nombre || !contacto) {
    return NextResponse.json({ ok: false, error: 'missing_required' }, { status: 400, headers: CORS_HEADERS });
  }

  // Cliente FERVOR esPropio
  const [owner] = await db.select().from(schema.clients).where(eq(schema.clients.esPropio, true)).limit(1);
  if (!owner) {
    return NextResponse.json({ ok: false, error: 'no_owner_client' }, { status: 500, headers: CORS_HEADERS });
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto);
  const email = isEmail ? contacto : undefined;
  const telefono = !isEmail ? contacto : undefined;

  // Atribución
  const utmSource = String(body.utm_source || '').slice(0, 64);
  const utmMedium = String(body.utm_medium || '').slice(0, 64);
  const utmCampaign = String(body.utm_campaign || '').slice(0, 128);
  const adId = String(body.ad_id || '').slice(0, 64);
  const postId = String(body.post_id || '').slice(0, 64);
  const referrer = String(body.referrer || req.headers.get('referer') || '').slice(0, 256);
  const userAgent = String(req.headers.get('user-agent') || '').slice(0, 256);

  // Fuente
  let fuente = String(body.source || '').slice(0, 32);
  if (!fuente) {
    if (adId || utmSource === 'facebook' || utmSource === 'instagram') fuente = 'ads';
    else if (utmMedium === 'organic' || utmSource === 'instagram') fuente = 'organico';
    else if (referrer.includes('instagram.com') || referrer.includes('facebook.com')) fuente = 'social';
    else fuente = 'web';
  }

  const notas = [
    negocio && `Negocio/rubro: ${negocio}`,
    problema && `Mensaje: ${problema}`,
    (utmSource || utmMedium || utmCampaign) && `UTM: ${utmSource || '-'} / ${utmMedium || '-'} / ${utmCampaign || '-'}`,
    adId && `Ad ID: ${adId}`,
    postId && `Post ID: ${postId}`,
    referrer && `Ref: ${referrer}`,
  ].filter(Boolean).join('\n');

  try {
    const [inserted] = await db.insert(schema.leads).values({
      clientId: owner.id,
      nombre,
      email,
      telefono,
      fuente,
      estado: 'nuevo',
      motivo: problema || undefined,
      notas: notas || undefined,
      ultimoContacto: new Date() as any,
    }).returning({ id: schema.leads.id });

    return NextResponse.json({ ok: true, id: inserted.id }, { headers: CORS_HEADERS });
  } catch (e: any) {
    console.error('lead create fail:', e?.message || e);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500, headers: CORS_HEADERS });
  }
}
