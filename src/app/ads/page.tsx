import { PageShell } from '@/components/page-shell';
import { listCampaigns, adsKpis, syncAds } from '@/lib/actions/ads';
import { listClientes } from '@/lib/actions/clientes';
import { Megaphone, RefreshCw, DollarSign, Target, MousePointerClick, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

const money = (v: unknown) => '$' + (Number(v) || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'text-ok bg-ok/10', PAUSED: 'text-warn bg-warn/10', ARCHIVED: 'text-fervor-smoke bg-fervor-ink-3',
};

export default async function AdsPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clientId = client ? Number(client) : undefined;
  const [clientes, campaigns, k] = await Promise.all([
    listClientes(), listCampaigns({ clientId }), adsKpis({ clientId }),
  ]);

  const kpis = [
    { label: 'Gasto 30d', value: money(k.spend), icon: DollarSign },
    { label: 'Resultados', value: (k.results ?? 0).toLocaleString('es-AR'), icon: Target },
    { label: 'Costo/result', value: k.results > 0 ? money(Number(k.spend) / k.results) : '—', icon: Activity },
    { label: 'Clicks', value: (k.clicks ?? 0).toLocaleString('es-AR'), icon: MousePointerClick },
    { label: 'Activas', value: `${k.activas ?? 0}/${k.total ?? 0}`, icon: Megaphone },
  ];

  return (
    <PageShell kicker="Meta Ads" title="Campañas" actions={
      clientId ? (
        <form action={async () => { 'use server'; await syncAds(clientId); }}>
          <button type="submit" className="btn-primary text-sm shadow-flame flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Sincronizar
          </button>
        </form>
      ) : null
    }>
      {/* filtro clientes */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <a href="/ads" className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${!clientId ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>Todos</a>
        {clientes.map((c) => (
          <a key={c.id} href={`/ads?client=${c.id}`} className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 ${clientId === c.id ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>
            {c.color && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}{c.nombre}
          </a>
        ))}
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {kpis.map((x) => (
          <div key={x.label} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs text-fervor-smoke uppercase tracking-wider font-mono">{x.label}</div>
              <x.icon className="h-4 w-4 text-fervor-flame" />
            </div>
            <div className="font-display text-2xl font-bold text-fervor-paper">{x.value}</div>
          </div>
        ))}
      </section>

      {/* tabla campañas */}
      {campaigns.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone className="h-10 w-10 text-fervor-flame/40 mx-auto mb-3" />
          <div className="text-fervor-paper font-medium mb-1">Sin campañas sincronizadas</div>
          <div className="text-fervor-smoke text-sm mb-5">
            {clientId ? 'Tocá Sincronizar para traer las campañas de Meta Ads.' : 'Elegí un cliente y sincronizá, o conectá su cuenta Meta en /config.'}
          </div>
          <a href="/config" className="btn-secondary text-sm">Configurar Meta</a>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-mono uppercase tracking-wider text-fervor-smoke border-b border-fervor-border">
                <th className="px-4 py-3">Campaña</th><th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Gasto</th><th className="px-4 py-3 text-right">Result.</th>
                <th className="px-4 py-3 text-right">Costo/res</th><th className="px-4 py-3 text-right">CTR</th>
                <th className="px-4 py-3 text-right">Impres.</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-fervor-border/50 hover:bg-fervor-ink-3/50">
                  <td className="px-4 py-3">
                    <div className="text-fervor-paper font-medium">{c.name || '(sin nombre)'}</div>
                    <div className="text-[11px] text-fervor-smoke flex items-center gap-1.5">
                      {c.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />}
                      {c.cliente} · {c.objective || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-mono px-2 py-1 rounded ${STATUS_COLOR[c.status ?? ''] ?? 'text-fervor-smoke bg-fervor-ink-3'}`}>{c.status || '—'}</span></td>
                  <td className="px-4 py-3 text-right font-mono text-fervor-paper">{money(c.spend)}</td>
                  <td className="px-4 py-3 text-right font-mono text-fervor-paper">{c.results ?? 0}</td>
                  <td className="px-4 py-3 text-right font-mono text-fervor-ash">{c.costPerResult ? money(c.costPerResult) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-fervor-ash">{c.ctr ? `${(Number(c.ctr)).toFixed(2)}%` : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-fervor-smoke">{(c.impressions ?? 0).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
