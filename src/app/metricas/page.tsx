import { PageShell } from '@/components/page-shell';
import { listSnapshots, snapshotsResumen } from '@/lib/actions/metricas';
import { listClientes } from '@/lib/actions/clientes';
import { MetricTrends, type SnapRow } from '@/components/metric-trends';
import { BarChart3, Users, Eye, Target, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

const METRICS = [
  { key: 'followers', label: 'Seguidores' },
  { key: 'reach', label: 'Alcance' },
  { key: 'newLeads', label: 'Leads' },
  { key: 'adSpend', label: 'Gasto ads' },
] as const;

const compact = (v: unknown) => {
  const n = Number(v) || 0;
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : String(n);
};

export default async function MetricasPage({ searchParams }: { searchParams: Promise<{ client?: string; m?: string; days?: string }> }) {
  const sp = await searchParams;
  const clientes = await listClientes();
  const clientId = sp.client ? Number(sp.client) : clientes[0]?.id;
  const metric = (METRICS.find((x) => x.key === sp.m)?.key ?? 'followers') as keyof SnapRow;
  const days = sp.days ? Number(sp.days) : 30;

  if (!clientId) {
    return (
      <PageShell kicker="Trends" title="Métricas">
        <div className="card text-center py-16">
          <BarChart3 className="h-10 w-10 text-fervor-flame/40 mx-auto mb-3" />
          <div className="text-fervor-paper font-medium mb-1">Sin clientes todavía</div>
          <div className="text-fervor-smoke text-sm mb-5">Agregá un cliente para ver sus tendencias.</div>
          <a href="/clientes" className="btn-primary text-sm shadow-flame">Ir a Clientes</a>
        </div>
      </PageShell>
    );
  }

  const [rows, resumen] = await Promise.all([
    listSnapshots({ clientId, days }), snapshotsResumen({ clientId, days }),
  ]);
  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams({ client: String(clientId) });
    if (metric !== 'followers') p.set('m', String(metric));
    if (days !== 30) p.set('days', String(days));
    for (const [k, v] of Object.entries(extra)) { if (v == null) p.delete(k); else p.set(k, String(v)); }
    return `/metricas?${p.toString()}`;
  };

  const kpis = [
    { label: 'Seguidores', value: resumen ? compact(resumen.followers) : '—', delta: resumen?.followersDelta, icon: Users },
    { label: `Alcance ${days}d`, value: resumen ? compact(resumen.reach) : '—', icon: Eye },
    { label: `Leads ${days}d`, value: resumen ? String(resumen.leads) : '—', icon: Target },
    { label: `Gasto ${days}d`, value: resumen ? '$' + compact(resumen.adSpend) : '—', icon: DollarSign },
  ];

  return (
    <PageShell kicker="Trends" title="Métricas">
      {/* filtro clientes */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {clientes.map((c) => (
          <a key={c.id} href={qs({ client: c.id })} className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 ${clientId === c.id ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>
            {c.color && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}{c.nombre}
          </a>
        ))}
        <div className="ml-auto flex items-center gap-1">
          {[7, 30, 90].map((d) => (
            <a key={d} href={qs({ days: d })} className={`px-2.5 py-1 rounded text-xs font-mono ${days === d ? 'bg-fervor-flame/15 text-fervor-flame' : 'text-fervor-smoke hover:text-fervor-ash'}`}>{d}d</a>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpis.map((x) => (
          <div key={x.label} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs text-fervor-smoke uppercase tracking-wider font-mono">{x.label}</div>
              <x.icon className="h-4 w-4 text-fervor-flame" />
            </div>
            <div className="font-display text-2xl font-bold text-fervor-paper">{x.value}</div>
            {x.delta != null && <div className={`text-xs mt-1 font-mono ${x.delta >= 0 ? 'text-ok' : 'text-alert'}`}>{x.delta >= 0 ? '+' : ''}{x.delta}%</div>}
          </div>
        ))}
      </section>

      {/* chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="kicker mb-1">Tendencia · {days} días</div>
            <h2 className="font-display text-lg font-bold text-fervor-paper">Evolución</h2>
          </div>
          <div className="flex items-center gap-1">
            {METRICS.map((m) => (
              <a key={m.key} href={qs({ m: m.key === 'followers' ? undefined : m.key })} className={`px-2.5 py-1 rounded text-xs ${metric === m.key ? 'bg-fervor-flame/15 text-fervor-flame' : 'text-fervor-smoke hover:text-fervor-ash'}`}>{m.label}</a>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-16 text-fervor-smoke text-sm">
            <BarChart3 className="h-10 w-10 text-fervor-flame/30 mx-auto mb-3" />
            Sin snapshots aún. El cron diario (<code className="text-fervor-flame">/api/cron/snapshot</code>) llena este trend.
          </div>
        ) : (
          <MetricTrends data={rows as SnapRow[]} metric={metric} />
        )}
      </div>
    </PageShell>
  );
}
