import { Sidebar } from '@/components/sidebar';
import { TrendChart } from '@/components/trend-chart';
import { dashboardKpis, dashboardTrend, dashboardClientes, dashboardTareas } from '@/lib/actions/dashboard';
import { syncAllClientes } from '@/lib/actions/meta-accounts';
import { Flame, Eye, Heart, Users, DollarSign, Target, ArrowUpRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const compact = (v: unknown) => {
  const n = Number(v) || 0;
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
  return String(Math.round(n));
};
const money = (v: unknown) => '$' + (Number(v) || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default async function Home() {
  const [k, trend, clientes, tareas] = await Promise.all([
    dashboardKpis(), dashboardTrend(), dashboardClientes(), dashboardTareas(),
  ]);

  const kpis = [
    { label: 'Alcance 30d', value: compact(k.reach), icon: Eye },
    { label: 'Engagement', value: compact(k.engagement), icon: Heart },
    { label: 'Leads nuevos', value: String(k.leads), icon: Users },
    { label: 'Gasto ads', value: money(k.adSpend), icon: DollarSign },
    { label: 'Costo/result', value: k.costPerResult != null ? money(k.costPerResult) : '—', icon: Target },
  ];

  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-fervor-border flex items-center justify-between">
          <div>
            <div className="kicker mb-1">Resumen general</div>
            <h1 className="font-display text-3xl font-bold text-fervor-paper">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <form action={async () => { 'use server'; await syncAllClientes(); }}>
              <button type="submit" className="btn-secondary text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Sincronizar Meta</button>
            </form>
            <Link href="/clientes" className="btn-primary text-sm shadow-flame">+ Cliente</Link>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {kpis.map((x) => (
              <div key={x.label} className="card card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs text-fervor-smoke uppercase tracking-wider font-mono">{x.label}</div>
                  <x.icon className="h-4 w-4 text-fervor-flame" />
                </div>
                <div className="font-display text-2xl font-bold text-fervor-paper">{x.value}</div>
              </div>
            ))}
          </section>

          {/* Trend + clientes */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="kicker mb-1">Últimos 14 días</div>
                  <h2 className="font-display text-lg font-bold text-fervor-paper">Alcance · Leads</h2>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-fervor-ash"><span className="w-2 h-2 rounded-full bg-fervor-flame" />Alcance</span>
                  <span className="flex items-center gap-1.5 text-fervor-ash"><span className="w-2 h-2 rounded-full bg-fervor-ember" />Leads</span>
                </div>
              </div>
              {trend.length === 0
                ? <div className="text-center py-16 text-fervor-smoke text-sm">Sin snapshots aún. El cron diario llena este trend.</div>
                : <TrendChart data={trend} />}
            </div>

            <div className="card">
              <div className="kicker mb-1">Cartera</div>
              <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Clientes</h2>
              {clientes.length === 0
                ? <div className="text-fervor-smoke text-sm py-8 text-center">Sin clientes todavía.</div>
                : (
                  <ul className="space-y-2">
                    {clientes.map((c) => (
                      <li key={c.id}>
                        <Link href={`/clientes/${c.id}`} className="flex items-center justify-between bg-fervor-ink-3 rounded-lg px-3 py-2.5 hover:border-fervor-flame/40 border border-transparent transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: c.color || '#FF5A1F' }}>
                              {c.nombre.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm text-fervor-paper flex items-center gap-1.5">
                                {c.nombre}
                                {c.esPropio && <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-fervor-flame/15 text-fervor-flame">Mi cuenta</span>}
                              </div>
                              <div className="text-[11px] text-fervor-smoke">{c.rubro || '—'}</div>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-fervor-smoke" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              <Link href="/clientes" className="block w-full mt-3 text-xs text-fervor-flame hover:text-fervor-flame-l py-2 text-center">+ Agregar cliente</Link>
            </div>
          </section>

          {/* Tareas + acceso videos */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="kicker mb-1">Pendientes</div>
                  <h2 className="font-display text-lg font-bold text-fervor-paper">Tareas</h2>
                </div>
                <span className="font-mono text-xs text-fervor-smoke">{tareas.length} abiertas</span>
              </div>
              {tareas.length === 0
                ? <div className="text-fervor-smoke text-sm py-8 text-center">Nada pendiente. 🔥</div>
                : (
                  <ul className="space-y-2">
                    {tareas.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 bg-fervor-ink-3 rounded-lg px-3 py-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-fervor-flame flex-shrink-0" />
                        <span className="text-sm text-fervor-ash flex-1">{t.titulo}</span>
                        {t.cliente && <span className="font-mono text-[10px] text-fervor-smoke">{t.cliente}</span>}
                        {t.categoria && <span className="font-mono text-[10px] uppercase text-fervor-smoke">{t.categoria}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              <Link href="/tareas" className="block w-full mt-3 text-xs text-fervor-flame hover:text-fervor-flame-l py-2 text-center">Ver todas →</Link>
            </div>

            <div className="card flex flex-col">
              <div className="kicker mb-1">Performance</div>
              <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Top reels</h2>
              <div className="text-fervor-smoke text-sm py-10 text-center flex-1 flex flex-col items-center justify-center">
                <Flame className="h-8 w-8 text-fervor-flame/30 mb-2" />
                Sincronizá Instagram para ver tus mejores reels.
                <Link href="/videos" className="btn-primary text-xs mt-3">Ir a Video Analytics</Link>
              </div>
            </div>
          </section>

          <footer className="text-center text-xs text-fervor-smoke/60 font-mono uppercase tracking-widest py-4">
            Oficina FERVOR · v0.1 · build {new Date().toISOString().slice(0, 10)}
          </footer>
        </div>
      </main>
    </div>
  );
}
