import { NextRequest, NextResponse } from 'next/server';
import { getOAuthStartUrl } from '@/lib/google/gcal';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 });
  }
  const origin = req.nextUrl.origin;
  const url = getOAuthStartUrl(origin);
  return NextResponse.redirect(url);
}
