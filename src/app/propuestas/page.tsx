import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { listPropuestas } from '@/lib/actions/propuestas';
import Link from 'next/link';
import { Plus, FileText, Check, X, Send, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

const fmt = (n: number, cur: string) =>
  cur === 'USD'
    ? `USD ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const ESTADO_BADGE: Record<string, { lbl: string; cls: string; Icon: any }> = {
  borrador:  { lbl: 'Borrador',  cls: 'bg-fervor-ink-3 text-fervor-smoke border-fervor-border-soft', Icon: Clock },
  enviada:   { lbl: 'Enviada',   cls: 'bg-fervor-flame/15 text-fervor-flame border-fervor-flame/40', Icon: Send },
  aceptada:  { lbl: 'Aceptada',  cls: 'bg-ok/15 text-ok border-ok/40', Icon: Check },
  rechazada: { lbl: 'Rechazada', cls: 'bg-alert/15 text-alert border-alert/40', Icon: X },
};

export default async function PropuestasPage() {
  const rows = await listPropuestas();
  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        <MobileNav />
        <header className="px-4 md:px-8 py-4 md:py-6 border-b border-fervor-border flex items-center justify-between">
          <div>
            <div className="kicker mb-1">Comercial</div>
            <h1 className="font-display text-3xl font-bold text-fervor-paper">Propuestas</h1>
          </div>
          <Link href="/propuestas/nueva" className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Nueva propuesta
          </Link>
        </header>

        <div className="p-4 md:p-8 space-y-4">
          {rows.length === 0 ? (
            <div className="card text-center py-16">
              <FileText className="h-12 w-12 text-fervor-smoke mx-auto mb-3" />
              <div className="text-fervor-smoke">Sin propuestas todavía.</div>
              <div className="mt-3">
                <Link href="/propuestas/nueva" className="btn-primary text-sm">Crear primera</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((p) => {
                const badge = ESTADO_BADGE[p.estado] || ESTADO_BADGE.borrador;
                const lineas = (p.servicios as any[]) || [];
                return (
                  <Link key={p.id} href={`/propuestas/${p.id}/preview`}
                    className="card card-hover flex items-center gap-4 hover:border-fervor-flame/40 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-fervor-ink-3 flex items-center justify-center text-fervor-flame">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-fervor-smoke">FRV-{String(p.id).padStart(4, '0')}</span>
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${badge.cls}`}>
                          <badge.Icon className="h-3 w-3" />{badge.lbl}
                        </span>
                      </div>
                      <h3 className="font-display text-lg text-fervor-paper">{p.clientName}</h3>
                      <div className="text-xs text-fervor-smoke flex items-center gap-3 mt-0.5">
                        {p.clientNegocio && <span>{p.clientNegocio}</span>}
                        <span>{lineas.length} servicio{lineas.length !== 1 ? 's' : ''}</span>
                        <span>{new Date(p.createdAt).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-fervor-smoke font-mono uppercase tracking-wider">Setup · MRR</div>
                      <div className="font-display text-lg text-fervor-flame">
                        {fmt(Number(p.setupTotal), p.currency)} <span className="text-fervor-smoke">·</span> {fmt(Number(p.mrrTotal), p.currency)}/mes
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
