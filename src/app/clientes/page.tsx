import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { listClientes } from '@/lib/actions/clientes';
import { Plus, ArrowRight, Instagram } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ESTADO_COLOR: Record<string, string> = {
  activo: 'text-ok bg-ok/10 border-ok/30',
  pausado: 'text-warn bg-warn/10 border-warn/30',
  cerrado: 'text-fervor-smoke bg-fervor-ink-3 border-fervor-border',
};

export default async function ClientesPage() {
  const rows = await listClientes();
  return (
    <PageShell
      kicker="Cartera"
      title="Clientes"
      actions={
        <Link href="/clientes/nuevo" className="btn-primary text-sm flex items-center gap-2 shadow-flame">
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Link>
      }
    >
      {rows.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-fervor-smoke mb-4">Todavía no hay clientes cargados.</div>
          <Link href="/clientes/nuevo" className="btn-primary text-sm inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Cargar primero
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="card card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                       style={{ background: c.color || '#FF5A1F' }}>
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <div className="font-display font-bold text-fervor-paper">{c.nombre}</div>
                    {c.rubro && <div className="text-xs text-fervor-smoke">{c.rubro}</div>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-fervor-smoke" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded border font-mono uppercase tracking-wider ${ESTADO_COLOR[c.estado] ?? ESTADO_COLOR.activo}`}>
                  {c.estado}
                </span>
                {c.igHandle && (
                  <span className="flex items-center gap-1 text-fervor-smoke">
                    <Instagram className="h-3 w-3" /> {c.igHandle}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
