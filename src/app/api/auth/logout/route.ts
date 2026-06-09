import { destroySession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  await destroySession();
  // Location relativo (ver login route): evita el host interno del proxy.
  return new Response(null, { status: 303, headers: { Location: '/login' } });
}
