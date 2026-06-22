import { Sidebar } from '@/components/sidebar';
import { TrendChart } from '@/components/trend-chart';
import { dashboardKpis, dashboardTrend, dashboardClientes, dashboardTareas } from '@/lib/actions/dashboard';
import { syncAllClientes } from '@/lib/actions/meta-accounts';
import { getDashboardStats, getObjetivosActivos } from '@/lib/actions/habits';
import { db, schema } from '@/lib/db';
import { and, eq, sql } from 'drizzle-orm';
import { Flame, Eye, Heart, Users, DollarSign, Target, ArrowUpRight, RefreshCw, Zap, Trophy, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function comercialAtencion() {
  const cutoff48 = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const cutoff5d = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const [stuck] = await db.select({ n: sql<number>`count(*)` }).from(schema.leads)
    .where(sql`${schema.leads.estado} IN ('nuevo','contactado') AND COALESCE(${schema.leads.ultimoContacto}, ${schema.leads.createdAt}) < ${cutoff48}`);
  const [stale] = await db.select({ n: sql<number>`count(*)` }).from(schema.propuestas)
    .where(and(eq(schema.propuestas.estado, 'enviada'), sql`${schema.propuestas.sentAt} < ${cutoff5d}`));
  return { leadsStuck: Number(stuck?.n ?? 0), propuestasStale: Number(stale?.n ?? 0) };
}

const compact = (v: unknown) => {
  const n = Number(v) || 0;
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
  return String(Math.round(n));
};
const money = (v: unknown) => '$' + (Number(v) || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default async function Home() {
  const [k, trend, clientes, tareas, stats, objetivos, atencion] = await Promise.all([
    dashboardKpis(), dashboardTrend(), dashboardClientes(), dashboardTareas(),
    getDashboardStats(), getObjetivosActivos(), comercialAtencion(),
  ]);
  const totalAtencion = atencion.leadsStuck + atencion.propuestasStale;

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
          {/* Atención comercial — sólo si hay algo */}
          {totalAtencion > 0 && (
            <section className="card border-fervor-flame/40 bg-fervor-flame/8 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-fervor-flame">
                <AlertCircle className="h-5 w-5" />
                <span className="font-display text-base uppercase tracking-wide">Atención comercial</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap ml-auto">
                {atencion.leadsStuck > 0 && (
                  <Link href="/crm" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fervor-ink-2 border border-fervor-flame/40 hover:border-fervor-flame transition-colors text-sm">
                    <Users className="h-3.5 w-3.5 text-fervor-flame" />
                    <span className="font-display text-fervor-flame">{atencion.leadsStuck}</span>
                    <span className="text-fervor-smoke text-xs">leads sin seguimiento +48h</span>
                  </Link>
                )}
                {atencion.propuestasStale > 0 && (
                  <Link href="/propuestas" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fervor-ink-2 border border-fervor-flame/40 hover:border-fervor-flame transition-colors text-sm">
                    <FileText className="h-3.5 w-3.5 text-fervor-flame" />
                    <span className="font-display text-fervor-flame">{atencion.propuestasStale}</span>
                    <span className="text-fervor-smoke text-xs">propuestas enviadas +5d sin cierre</span>
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* Hábitos + Objetivos */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Link href="/habitos" className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="kicker">Hábitos hoy</div>
                <Zap className="h-4 w-4 text-fervor-flame" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-fervor-paper">{stats.habitosHoy.pct}%</span>
                <span className="text-xs text-fervor-smoke">{stats.habitosHoy.completados}/{stats.habitosHoy.total}</span>
              </div>
              <div className="h-1.5 bg-fervor-ink-3 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-fervor-flame" style={{ width: `${stats.habitosHoy.pct}%` }} />
              </div>
            </Link>
            <Link href="/objetivos" className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="kicker">Objetivos activos</div>
                <Trophy className="h-4 w-4 text-fervor-flame" />
              </div>
              <div className="font-display text-3xl font-bold text-fervor-paper">{stats.objetivosActivos}</div>
              <div className="text-xs text-fervor-smoke mt-1">en estrategia 90d</div>
            </Link>
            <Link href="/tareas" className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="kicker">Tareas pendientes</div>
                <Target className="h-4 w-4 text-fervor-flame" />
              </div>
              <div className="font-display text-3xl font-bold text-fervor-paper">{stats.tareasPendientes}</div>
              <div className="text-xs text-fervor-smoke mt-1">por completar</div>
            </Link>
            <div className="card border-fervor-flame/30 bg-fervor-flame/5">
              <div className="kicker mb-1">Top objetivo</div>
              {objetivos[0] ? (
                <>
                  <div className="font-display text-sm font-bold text-fervor-paper mb-2 line-clamp-2">{objetivos[0].titulo}</div>
                  <div className="flex items-baseline justify-between text-xs text-fervor-smoke">
                    <span>{Number(objetivos[0].kpiActual || 0).toLocaleString('es-AR')} / {Number(objetivos[0].kpiTarget || 0).toLocaleString('es-AR')}</span>
                    <span className="text-fervor-flame font-mono">{Math.round((Number(objetivos[0].kpiActual || 0) / Number(objetivos[0].kpiTarget || 1)) * 100)}%</span>
                  </div>
                </>
              ) : (
                <div className="text-fervor-smoke text-xs">Sin objetivos.</div>
              )}
            </div>
          </section>

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
