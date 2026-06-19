import { NextRequest, NextResponse } from 'next/server';
import { getOAuthStartUrl, publicOrigin } from '@/lib/meta/oauth';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.json({ error: 'META_APP_ID / META_APP_SECRET not configured' }, { status: 500 });
  }
  const state = randomBytes(16).toString('hex');
  const url = getOAuthStartUrl(publicOrigin(req), state);
  const res = NextResponse.redirect(url);
  // CSRF state cookie (10 min)
  res.cookies.set('meta_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
