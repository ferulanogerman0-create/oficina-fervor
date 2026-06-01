import { PageShell } from '@/components/page-shell';
import { listClientes } from '@/lib/actions/clientes';
import { Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const clientes = await listClientes();
  const env = {
    metaAppId: !!process.env.META_APP_ID,
    metaSecret: !!process.env.META_APP_SECRET,
    api: process.env.META_API_VERSION || 'v21.0',
    db: !!process.env.DATABASE_URL,
  };
  return (
    <PageShell kicker="Setup" title="Configuración">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="kicker mb-2">Entorno</div>
          <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Variables</h2>
          <ul className="space-y-2 text-sm font-mono">
            <Row k="META_APP_ID" ok={env.metaAppId} />
            <Row k="META_APP_SECRET" ok={env.metaSecret} />
            <Row k="META_API_VERSION" val={env.api} ok={true} />
            <Row k="DATABASE_URL" ok={env.db} />
          </ul>
          <div className="mt-4 text-xs text-fervor-smoke">Setealas en EasyPanel → tutaller-app → Entorno.</div>
        </div>

        <div className="card">
          <div className="kicker mb-2">Meta por cliente</div>
          <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Tokens</h2>
          {clientes.length === 0 && <div className="text-sm text-fervor-smoke">Cargá clientes primero.</div>}
          <ul className="space-y-2">
            {clientes.map((c) => (
              <li key={c.id} className="flex items-center justify-between bg-fervor-ink-3 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color || '#FF5A1F' }} />
                  <span className="text-sm text-fervor-paper">{c.nombre}</span>
                </div>
                <span className="text-[10px] font-mono uppercase text-fervor-smoke">Sin conectar</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-fervor-smoke">
            Próximo: conexión OAuth con Facebook Login → guarda token de Página + IG Business + Ad Account.
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Row({ k, ok, val }: { k: string; ok: boolean; val?: string }) {
  return (
    <li className="flex items-center justify-between bg-fervor-ink-3 px-3 py-2 rounded-lg">
      <span className="text-fervor-paper">{k}</span>
      {val ? <span className="text-fervor-flame">{val}</span> :
        ok ? <Settings className="h-3.5 w-3.5 text-ok" /> : <span className="text-alert text-xs">faltante</span>}
    </li>
  );
}
