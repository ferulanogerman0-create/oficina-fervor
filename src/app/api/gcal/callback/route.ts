import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, getUserEmail, saveCreds } from '@/lib/google/gcal';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 });
  try {
    const tok = await exchangeCode(code, req.nextUrl.origin);
    const email = await getUserEmail(tok.access_token);
    await saveCreds({ ...tok, email });
    return new Response(null, { status: 303, headers: { Location: '/habitos?gcal=ok' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'oauth failed' }, { status: 500 });
  }
}
