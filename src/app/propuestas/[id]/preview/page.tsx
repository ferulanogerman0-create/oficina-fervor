import { getPropuesta, marcarEnviada, marcarAceptada, marcarRechazada, deletePropuesta, ensurePublicToken, sendPropuestaMail } from '@/lib/actions/propuestas';
import { renderPropuestaHTML, type PropuestaData } from '@/lib/propuestas/template';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Send, Check, X, Trash2, FileText, Link as LinkIcon, Mail, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PropuestaPreviewPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await getPropuesta(Number(id));
  if (!p) return notFound();

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'oficina.wolfdma.website';
  const proto = h.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;
  const publicUrl = p.publicToken ? `${baseUrl}/p/${p.publicToken}` : null;

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
  const html = renderPropuestaHTML(data);

  return (
    <div className="min-h-screen flex flex-col bg-fervor-ink">
      {/* Toolbar */}
      <div className="border-b border-fervor-border px-6 py-3 flex items-center justify-between flex-wrap gap-3 bg-fervor-ink-2">
        <div className="flex items-center gap-3">
          <Link href="/propuestas" className="text-fervor-smoke hover:text-fervor-flame"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <div className="kicker">FRV-{String(p.id).padStart(4, '0')} · {p.estado}</div>
            <div className="font-display text-lg text-fervor-paper">{p.clientName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {p.viewCount > 0 && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-fervor-flame flex items-center gap-1">
              <Eye className="h-3 w-3" /> {p.viewCount} {p.viewCount === 1 ? 'vista' : 'vistas'}
            </span>
          )}
          {!publicUrl ? (
            <form action={async () => { 'use server'; await ensurePublicToken(p.id); }}>
              <button className="btn-secondary text-xs flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Generar link público</button>
            </form>
          ) : (
            <a href={publicUrl} target="_blank" className="btn-secondary text-xs flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" /> Ver link público
            </a>
          )}
          {p.clientEmail && (
            <form action={async () => {
              'use server';
              const h2 = await headers();
              const host2 = h2.get('x-forwarded-host') || h2.get('host') || 'oficina.wolfdma.website';
              const proto2 = h2.get('x-forwarded-proto') || 'https';
              try { await sendPropuestaMail(p.id, `${proto2}://${host2}`); } catch (e: any) { console.error('sendPropuestaMail:', e?.message); }
            }}>
              <button className="btn-primary text-xs flex items-center gap-1.5 shadow-flame"><Mail className="h-3.5 w-3.5" /> Enviar por email</button>
            </form>
          )}
          <Link href={`/propuestas/${p.id}/print`} target="_blank" className="btn-secondary text-xs flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> PDF
          </Link>
          {p.estado === 'borrador' && (
            <form action={async () => { 'use server'; await marcarEnviada(p.id); }}>
              <button className="btn-secondary text-xs flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Marcar enviada</button>
            </form>
          )}
          {p.estado === 'enviada' && (
            <>
              <form action={async () => { 'use server'; await marcarAceptada(p.id); }}>
                <button className="btn-primary text-xs flex items-center gap-1.5 shadow-flame"><Check className="h-3.5 w-3.5" /> Aceptada</button>
              </form>
              <form action={async () => { 'use server'; await marcarRechazada(p.id); }}>
                <button className="btn-secondary text-xs flex items-center gap-1.5"><X className="h-3.5 w-3.5" /> Rechazada</button>
              </form>
            </>
          )}
          <form action={async () => { 'use server'; await deletePropuesta(p.id); }}>
            <button className="btn-secondary text-xs flex items-center gap-1.5 text-alert"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
          </form>
        </div>
      </div>

      {/* Preview iframe — el HTML completo se renderiza adentro */}
      <iframe
        title="Vista previa propuesta"
        srcDoc={html}
        className="flex-1 w-full bg-white border-0"
        style={{ minHeight: '85vh' }}
      />
    </div>
  );
}
