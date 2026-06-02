import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { getCliente } from '@/lib/actions/clientes';
import { adsKpis, listCampaigns } from '@/lib/actions/ads';
import { videosKpis, listTopPosts } from '@/lib/actions/videos';
import { listSnapshots, snapshotsResumen } from '@/lib/actions/metricas';
import { listLeads } from '@/lib/actions/leads';
import { listTareas } from '@/lib/actions/tareas';
import { listIdeas } from '@/lib/actions/contenido';
import { MetricTrends, type SnapRow } from '@/components/metric-trends';
import { ETAPAS_LEAD, ESTADOS_IDEA } from '@/lib/types';
import {
  Settings, Instagram, Users, Eye, Heart, DollarSign, Target, Film, Play, Bookmark,
  Megaphone, ListChecks, CalendarDays, BarChart3, Flame, ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const compact = (v: unknown) => {
  const n = Number(v) || 0;
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : String(Math.round(n));
};
const money = (v: unknown) => '$' + (Number(v) || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

const ETAPA_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', calificado: 'Calificado',
  propuesta: 'Propuesta', cerrado: 'Cerrado', perdido: 'Perdido',
};
const IDEA_LABEL: Record<string, string> = {
  idea: 'Ideas', produccion: 'Producción', aprobado: 'Aprobado', posteado: 'Posteado',
};

export default async function ClienteDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cid = Number(id);
  if (!cid) notFound();
  const c = await getCliente(cid);
  if (!c) notFound();

  const [ak, camps, vk, reels, resumen, snaps, leads, tareas, ideas] = await Promise.all([
    adsKpis({ clientId: cid }),
    listCampaigns({ clientId: cid }),
    videosKpis({ clientId: cid }),
    listTopPosts({ clientId: cid, onlyReels: true, limit: 6 }),
    snapshotsResumen({ clientId: cid, days: 30 }),
    listSnapshots({ clientId: cid, days: 30 }),
    listLeads({ clientId: cid }),
    listTareas({ clientId: cid, done: false }),
    listIdeas({ clientId: cid }),
  ]);

  const kpis = [
    { label: 'Seguidores', value: resumen ? compact(resumen.followers) : '—', icon: Users, delta: resumen?.followersDelta },
    { label: 'Alcance 30d', value: compact(resumen?.reach ?? vk.reach), icon: Eye },
    { label: 'Eng. prom.', value: `${(Number(vk.avgEng) * 100 || 0).toFixed(1)}%`, icon: Heart },
    { label: 'Leads 30d', value: String(resumen?.leads ?? leads.length), icon: Target },
    { label: 'Gasto ads', value: money(ak.spend), icon: DollarSign },
  ];

  const accent = c.color || '#FF5A1F';
  const Tab = ({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) => (
    <Link href={href} className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${active ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>{children}</Link>
  );

  return (
    <PageShell kicker={c.esPropio ? 'Oficina central' : 'Cliente'} title={c.nombre} actions={
      <Link href={`/clientes/${cid}/editar`} className="btn-secondary text-sm flex items-center gap-2">
        <Settings className="h-4 w-4" /> Editar
      </Link>
    }>
      {/* identidad + tabs */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: accent }}>
          {c.esPropio ? <Flame className="h-6 w-6" /> : c.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-fervor-paper">{c.nombre}</span>
            {c.esPropio && <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-fervor-flame/15 text-fervor-flame">Cuenta propia</span>}
          </div>
          <div className="text-xs text-fervor-smoke flex items-center gap-2">
            {c.rubro && <span>{c.rubro}</span>}
            {c.igHandle && <span className="flex items-center gap-1"><Instagram className="h-3 w-3" />{c.igHandle}</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Tab href={`/clientes/${cid}`} active>Resumen</Tab>
          <Tab href={`/metricas?client=${cid}`}>Métricas</Tab>
          <Tab href={`/ads?client=${cid}`}>Ads</Tab>
          <Tab href={`/videos?client=${cid}`}>Reels</Tab>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {kpis.map((x) => (
          <div key={x.label} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs text-fervor-smoke uppercase tracking-wider font-mono">{x.label}</div>
              <x.icon className="h-4 w-4" style={{ color: accent }} />
            </div>
            <div className="font-display text-2xl font-bold text-fervor-paper">{x.value}</div>
            {x.delta != null && <div className={`text-xs mt-1 font-mono ${x.delta >= 0 ? 'text-ok' : 'text-alert'}`}>{x.delta >= 0 ? '+' : ''}{x.delta}%</div>}
          </div>
        ))}
      </section>

      {/* trend + pipeline */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><div className="kicker mb-1">Tendencia · 30 días</div><h2 className="font-display text-lg font-bold text-fervor-paper">Seguidores</h2></div>
            <Link href={`/metricas?client=${cid}`} className="text-xs text-fervor-flame hover:text-fervor-flame-l flex items-center gap-1">Ver más <ExternalLink className="h-3 w-3" /></Link>
          </div>
          {snaps.length === 0
            ? <div className="text-center py-14 text-fervor-smoke text-sm"><BarChart3 className="h-9 w-9 text-fervor-flame/30 mx-auto mb-2" />Sin snapshots aún. El cron diario llena el trend.</div>
            : <MetricTrends data={snaps as SnapRow[]} metric="followers" />}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div><div className="kicker mb-1">CRM</div><h2 className="font-display text-lg font-bold text-fervor-paper">Pipeline</h2></div>
            <Link href="/crm" className="text-xs text-fervor-flame hover:text-fervor-flame-l">Abrir</Link>
          </div>
          <ul className="space-y-1.5">
            {ETAPAS_LEAD.map((e) => {
              const n = leads.filter((l) => l.estado === e).length;
              return (
                <li key={e} className="flex items-center justify-between text-sm">
                  <span className="text-fervor-ash">{ETAPA_LABEL[e]}</span>
                  <span className="font-mono text-fervor-smoke">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* top reels */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-fervor-paper flex items-center gap-2"><Film className="h-4 w-4 text-fervor-flame" /> Top reels</h2>
          <Link href={`/videos?client=${cid}`} className="text-xs text-fervor-flame hover:text-fervor-flame-l">Ver todos</Link>
        </div>
        {reels.length === 0 ? (
          <div className="card text-center py-10 text-fervor-smoke text-sm">
            <Film className="h-8 w-8 text-fervor-flame/30 mx-auto mb-2" />Sincronizá Instagram en <Link href={`/videos?client=${cid}`} className="text-fervor-flame">Reels</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {reels.map((p, i) => (
              <a key={p.id} href={p.permalink || '#'} target="_blank" rel="noreferrer" className="card card-hover p-0 overflow-hidden group">
                <div className="relative aspect-[4/5] bg-fervor-ink-3">
                  {p.thumbnailUrl
                    ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-full flex items-center justify-center"><Film className="h-6 w-6 text-fervor-flame/30" /></div>}
                  <div className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-fervor-flame">#{i + 1}</div>
                </div>
                <div className="p-2 text-[10px] font-mono text-fervor-smoke flex items-center justify-between">
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{compact(p.reach)}</span>
                  <span className="flex items-center gap-0.5"><Play className="h-2.5 w-2.5" />{compact(p.plays)}</span>
                  <span className="flex items-center gap-0.5"><Bookmark className="h-2.5 w-2.5" />{compact(p.saves)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* campañas + tareas + contenido */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* campañas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-fervor-paper flex items-center gap-2"><Megaphone className="h-4 w-4 text-fervor-flame" /> Ads</h2>
            <Link href={`/ads?client=${cid}`} className="text-xs text-fervor-flame hover:text-fervor-flame-l">Ver</Link>
          </div>
          <div className="text-xs text-fervor-smoke font-mono mb-3">{money(ak.spend)} · {ak.results ?? 0} result · {ak.activas ?? 0} activas</div>
          {camps.length === 0
            ? <div className="text-fervor-smoke text-sm py-4 text-center">Sin campañas.</div>
            : (
              <ul className="space-y-2">
                {camps.slice(0, 5).map((c2) => (
                  <li key={c2.id} className="flex items-center justify-between text-sm bg-fervor-ink-3 rounded-lg px-3 py-2">
                    <span className="text-fervor-ash truncate flex-1">{c2.name || '(sin nombre)'}</span>
                    <span className="font-mono text-fervor-smoke ml-2">{money(c2.spend)}</span>
                  </li>
                ))}
              </ul>
            )}
        </div>

        {/* tareas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-fervor-paper flex items-center gap-2"><ListChecks className="h-4 w-4 text-fervor-flame" /> Tareas</h2>
            <Link href="/tareas" className="text-xs text-fervor-flame hover:text-fervor-flame-l">{tareas.length} abiertas</Link>
          </div>
          {tareas.length === 0
            ? <div className="text-fervor-smoke text-sm py-4 text-center">Nada pendiente. 🔥</div>
            : (
              <ul className="space-y-2">
                {tareas.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm bg-fervor-ink-3 rounded-lg px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-fervor-flame flex-shrink-0" />
                    <span className="text-fervor-ash flex-1 truncate">{t.titulo}</span>
                    {t.categoria && <span className="font-mono text-[10px] uppercase text-fervor-smoke">{t.categoria}</span>}
                  </li>
                ))}
              </ul>
            )}
        </div>

        {/* contenido */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-fervor-paper flex items-center gap-2"><CalendarDays className="h-4 w-4 text-fervor-flame" /> Contenido</h2>
            <Link href="/contenido" className="text-xs text-fervor-flame hover:text-fervor-flame-l">Board</Link>
          </div>
          <ul className="space-y-1.5">
            {ESTADOS_IDEA.map((e) => {
              const n = ideas.filter((i) => i.estado === e).length;
              return (
                <li key={e} className="flex items-center justify-between text-sm">
                  <span className="text-fervor-ash">{IDEA_LABEL[e]}</span>
                  <span className="font-mono text-fervor-smoke">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
