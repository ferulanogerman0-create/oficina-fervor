// Vista pública de propuesta — serve HTML directo con CTA acepto al pie
import { NextRequest } from 'next/server';
import { getPropuestaByToken, bumpView } from '@/lib/actions/propuestas';
import { renderPropuestaHTML, type PropuestaData } from '@/lib/propuestas/template';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const p = await getPropuestaByToken(token);
  if (!p) return new Response('Propuesta no encontrada', { status: 404 });

  bumpView(p.id).catch(() => {});

  const data: PropuestaData = {
    id: p.id,
    clientName: p.clientName,
    clientNegocio: p.clientNegocio || undefined,
    clientEmail: p.clientEmail || undefined,
    lineas: (p.servicios as any[]) || [],
    setupTotal: Number(p.setupTotal),
    mrrTotal: Number(p.mrrTotal),
    currency: p.currency,
    validityDays: p.validityDays,
    fechaEmision: new Date(p.createdAt).toISOString().slice(0, 10),
  };
  const aceptada = p.estado === 'aceptada';

  const ctaForm = aceptada
    ? `<div class="cta-bar" style="background:#FF5A1F;color:#fff;font-family:'Anton',sans-serif;text-transform:uppercase;text-align:center;letter-spacing:.04em;font-size:18px;padding:18px">✓ Propuesta aceptada · gracias</div>`
    : `
      <div class="cta-bar" style="background:#0A0A0A;border-top:2px solid #FF5A1F;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;font-family:'Inter',sans-serif">
        <div style="color:#FAFAFA;font-size:13px">¿Avanzamos con esta propuesta?</div>
        <form method="POST" action="/p/${token}/accept" style="display:flex;gap:8px;margin:0">
          <button type="submit" style="background:#FF5A1F;color:#fff;border:0;padding:12px 28px;font-family:'Anton',sans-serif;text-transform:uppercase;letter-spacing:.04em;font-size:14px;cursor:pointer">Acepto la propuesta</button>
        </form>
      </div>`;

  let html = renderPropuestaHTML(data);
  html = html.replace('</body>', `<style>.cta-bar{position:fixed;bottom:0;left:0;right:0;z-index:100}body{padding-bottom:80px}</style>${ctaForm}</body>`);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex,nofollow',
      'Cache-Control': 'no-store',
    },
  });
}
