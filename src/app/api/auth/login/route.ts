import { NextResponse } from 'next/server';
import { loginWithCredentials } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  if (!username || !password) {
    return NextResponse.redirect(new URL('/login?error=missing', req.url), 303);
  }
  const user = await loginWithCredentials(username, password);
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=bad_creds', req.url), 303);
  }
  return NextResponse.redirect(new URL('/', req.url), 303);
}
