import { Sidebar } from '@/components/sidebar';
import { TrendChart } from '@/components/trend-chart';
import { Flame, TrendingUp, Eye, Heart, Users, DollarSign, Target, ArrowUpRight } from 'lucide-react';

const MOCK_TREND = [
  { d: '01', reach: 1200, engagement: 320 },
  { d: '02', reach: 1450, engagement: 410 },
  { d: '03', reach: 1380, engagement: 380 },
  { d: '04', reach: 1620, engagement: 460 },
  { d: '05', reach: 1890, engagement: 540 },
  { d: '06', reach: 1750, engagement: 510 },
  { d: '07', reach: 2100, engagement: 620 },
  { d: '08', reach: 2350, engagement: 700 },
  { d: '09', reach: 2580, engagement: 760 },
  { d: '10', reach: 2420, engagement: 720 },
  { d: '11', reach: 2710, engagement: 810 },
  { d: '12', reach: 2890, engagement: 870 },
];

const KPIS = [
  { label: 'Alcance 30d', value: '48.2K', delta: '+12%', icon: Eye, up: true },
  { label: 'Engagement', value: '3.8K', delta: '+18%', icon: Heart, up: true },
  { label: 'Leads nuevos', value: '24', delta: '+4', icon: Users, up: true },
  { label: 'Gasto ads', value: '$87K', delta: '-5%', icon: DollarSign, up: false },
  { label: 'ROAS', value: '4.2x', delta: '+0.6', icon: Target, up: true },
];

const CLIENTES = [
  { slug: 'fma', nombre: 'FMA Mecatrónica', rubro: 'Taller', estado: 'Activo', color: '#00B4D8' },
  { slug: 'victoria', nombre: 'Victoria Carbone', rubro: 'Psicología', estado: 'Activo', color: '#A08880' },
];

const TAREAS_HOY = [
  { titulo: 'Editar reel FMA — 5 señales inyección', cat: 'contenido' },
  { titulo: 'Revisar campaña FF Performance', cat: 'ads' },
  { titulo: 'Llamar lead Juan T. (cliente FMA)', cat: 'crm' },
];

export default function Home() {
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
            <button className="btn-secondary text-sm">Sincronizar Meta</button>
            <button className="btn-primary text-sm shadow-flame">+ Nuevo</button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {KPIS.map((k) => (
              <div key={k.label} className="card card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs text-fervor-smoke uppercase tracking-wider font-mono">{k.label}</div>
                  <k.icon className="h-4 w-4 text-fervor-flame" />
                </div>
                <div className="font-display text-2xl font-bold text-fervor-paper">{k.value}</div>
                <div className={`text-xs mt-1 font-mono ${k.up ? 'text-ok' : 'text-alert'}`}>
                  {k.delta} <span className="text-fervor-smoke">vs 30d ant.</span>
                </div>
              </div>
            ))}
          </section>

          {/* Trend chart + clientes */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="kicker mb-1">Últimos 12 días</div>
                  <h2 className="font-display text-lg font-bold text-fervor-paper">Alcance · Engagement</h2>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-fervor-ash"><span className="w-2 h-2 rounded-full bg-fervor-flame"/>Alcance</span>
                  <span className="flex items-center gap-1.5 text-fervor-ash"><span className="w-2 h-2 rounded-full bg-fervor-ember"/>Engagement</span>
                </div>
              </div>
              <TrendChart data={MOCK_TREND} />
            </div>

            <div className="card">
              <div className="kicker mb-1">Cartera</div>
              <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Clientes</h2>
              <ul className="space-y-2">
                {CLIENTES.map((c) => (
                  <li key={c.slug} className="flex items-center justify-between bg-fervor-ink-3 rounded-lg px-3 py-2.5 hover:border-fervor-flame/40 border border-transparent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: c.color }}>
                        {c.nombre.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm text-fervor-paper">{c.nombre}</div>
                        <div className="text-[11px] text-fervor-smoke">{c.rubro}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-fervor-smoke" />
                  </li>
                ))}
              </ul>
              <button className="w-full mt-3 text-xs text-fervor-flame hover:text-fervor-flame-l py-2">+ Agregar cliente</button>
            </div>
          </section>

          {/* Tareas + Top videos */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="kicker mb-1">Para hoy</div>
                  <h2 className="font-display text-lg font-bold text-fervor-paper">Tareas</h2>
                </div>
                <span className="font-mono text-xs text-fervor-smoke">{TAREAS_HOY.length} pendientes</span>
              </div>
              <ul className="space-y-2">
                {TAREAS_HOY.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 bg-fervor-ink-3 rounded-lg px-3 py-2.5">
                    <input type="checkbox" className="accent-fervor-flame" />
                    <span className="text-sm text-fervor-ash flex-1">{t.titulo}</span>
                    <span className="font-mono text-[10px] uppercase text-fervor-smoke">{t.cat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div className="kicker mb-1">Top reels últimos 30d</div>
              <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Performance</h2>
              <div className="text-fervor-smoke text-sm py-12 text-center">
                <Flame className="h-8 w-8 text-fervor-flame/30 mx-auto mb-2" />
                Conectá Meta para ver tus mejores reels.
                <div className="mt-3">
                  <button className="btn-primary text-xs">Conectar Meta</button>
                </div>
              </div>
            </div>
          </section>

          <footer className="text-center text-xs text-fervor-smoke/60 font-mono uppercase tracking-widest py-4">
            Oficina FERVOR · v0.1 · build {new Date().toISOString().slice(0,10)}
          </footer>
        </div>
      </main>
    </div>
  );
}
