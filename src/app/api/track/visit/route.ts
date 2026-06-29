import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Endpoint público para tracking de pageviews desde fervorar.com
 * (Pixel propio - independiente de Meta Pixel).
 *
 * POST /api/track/visit
 * Body: { path, referrer?, utm_source?, utm_medium?, utm_campaign? }
 *
 * Granularidad: 1 row por (clientId, date, path, refSource) — increment counter.
 * Cliente = el "esPropio = true" (FERVOR cuenta central).
 */

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { /* */ }

  const path: string = String(body?.path || '/').slice(0, 256);
  const referrer: string = String(body?.referrer || '');
  const utmSource: string | null = body?.utm_source ? String(body.utm_source).slice(0, 64) : null;
  const utmMedium: string | null = body?.utm_medium ? String(body.utm_medium).slice(0, 64) : null;
  const utmCampaign: string | null = body?.utm_campaign ? String(body.utm_campaign).slice(0, 128) : null;

  // Cliente propio FERVOR
  const [client] = await db.select().from(schema.clients)
    .where(eq(schema.clients.esPropio, true)).limit(1);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'no propio client' }, { status: 200, headers: CORS_HEADERS });
  }

  // Derivar refSource desde utm o referrer
  const refSource = utmSource || deriveSource(referrer);
  const refMedium = utmMedium || (refSource === 'direct' ? null : 'referral');

  const today = new Date().toISOString().slice(0, 10);

  // Upsert (clientId, date, path, refSource) → increment pageviews
  await db.insert(schema.webVisits).values({
    clientId: client.id,
    date: today,
    path,
    pageviews: 1,
    uniqueVisitors: 1, // best-effort: misma sesión cuenta 1; podríamos cookie-dedupe en una v2
    refSource: refSource || null,
    refMedium: refMedium || null,
    refCampaign: utmCampaign,
  }).onConflictDoUpdate({
    target: [schema.webVisits.clientId, schema.webVisits.date, schema.webVisits.path, schema.webVisits.refSource],
    set: {
      pageviews: sql`${schema.webVisits.pageviews} + 1`,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS });
}

function deriveSource(referrer: string): string {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('facebook.com') || host.includes('fb.me')) return 'facebook';
    if (host.includes('google.')) return 'google';
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'whatsapp';
    return host.split('.').slice(-2, -1)[0] || 'referral';
  } catch { return 'referral'; }
}
