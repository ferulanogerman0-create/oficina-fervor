// HTML print-friendly endpoint. Browser → Ctrl+P → Guardar como PDF.
// Devuelve el HTML rendereado del template directamente con auto-print JS opcional.

import { NextRequest } from 'next/server';
import { getPropuesta } from '@/lib/actions/propuestas';
import { renderPropuestaHTML, type PropuestaData } from '@/lib/propuestas/template';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = await getPropuesta(Number(id));
  if (!p) return new Response('Not found', { status: 404 });

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

  const auto = req.nextUrl.searchParams.get('autoprint') === '1';
  let html = renderPropuestaHTML(data);
  if (auto) {
    html = html.replace('</body>', `<script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script></body>`);
  }
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex,nofollow',
    },
  });
}
