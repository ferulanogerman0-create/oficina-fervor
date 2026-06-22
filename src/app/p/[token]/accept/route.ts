// Aceptación pública de propuesta vía POST form
import { NextRequest, NextResponse } from 'next/server';
import { aceptarPorToken } from '@/lib/actions/propuestas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  try {
    await aceptarPorToken(token);
  } catch {
    return new Response('No se pudo aceptar', { status: 400 });
  }
  return NextResponse.redirect(new URL(`/p/${token}`, req.url), { status: 303 });
}
