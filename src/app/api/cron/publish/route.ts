import { NextRequest, NextResponse } from 'next/server';
import { publicarPendientes } from '@/lib/actions/publicar';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Publica las piezas auto-programadas cuya hora ya llegó.
// Llamar cada ~5-15 min: GET /api/cron/publish?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const r = await publicarPendientes();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
