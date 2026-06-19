import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { sendTelegram } from '@/lib/telegram';

/**
 * Colector central de reportes de bug/soporte de TODAS las apps FERVOR.
 *
 * POST /api/bugs  (público, CORS) — recibe el reporte desde cualquier app,
 *   lo guarda y notifica a Telegram (Germán).
 *   Body: { app, mensaje, url?, usuario?, contacto?, userAgent? }
 *
 * GET /api/bugs?secret=XXX[&estado=nuevo]  — listar (para que Claude lea).
 *   Requiere BUGS_SECRET (o sesión, vía la página /soporte).
 */
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

const APP_LABEL: Record<string, string> = {
  tutaller: 'TuTaller.app',
  agenciafacil: 'Agencia Fácil',
  fma: 'FMA app',
  oficina: 'Oficina FERVOR',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { /* */ }

  const mensaje = String(body?.mensaje || '').trim().slice(0, 4000);
  const app = String(body?.app || 'desconocida').toLowerCase().slice(0, 48);
  if (!mensaje) {
    return NextResponse.json({ ok: false, error: 'mensaje vacío' }, { status: 400, headers: CORS });
  }
  const url = body?.url ? String(body.url).slice(0, 512) : null;
  const usuario = body?.usuario ? String(body.usuario).slice(0, 128) : null;
  const contacto = body?.contacto ? String(body.contacto).slice(0, 160) : null;
  const userAgent = (body?.userAgent || req.headers.get('user-agent') || '').slice(0, 512);

  const [row] = await db.insert(schema.bugReports)
    .values({ app, mensaje, url, usuario, contacto, userAgent })
    .returning({ id: schema.bugReports.id });

  // Notificar a Germán por Telegram (no bloquea la respuesta si falla)
  const label = APP_LABEL[app] || app;
  const msg =
    `🐞 <b>Reporte de bug</b> · ${label}\n` +
    `<b>#${row?.id}</b>\n\n` +
    `${escapeHtml(mensaje)}\n\n` +
    (usuario ? `👤 ${escapeHtml(usuario)}\n` : '') +
    (contacto ? `📩 ${escapeHtml(contacto)}\n` : '') +
    (url ? `🔗 ${escapeHtml(url)}` : '');
  sendTelegram(msg).catch(() => {});

  return NextResponse.json({ ok: true, id: row?.id }, { status: 200, headers: CORS });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.BUGS_SECRET || secret !== process.env.BUGS_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const estado = req.nextUrl.searchParams.get('estado');
  const q = db.select().from(schema.bugReports).orderBy(desc(schema.bugReports.createdAt)).limit(100);
  const rows = estado
    ? await db.select().from(schema.bugReports).where(eq(schema.bugReports.estado, estado)).orderBy(desc(schema.bugReports.createdAt)).limit(100)
    : await q;
  return NextResponse.json({ ok: true, count: rows.length, reports: rows });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
