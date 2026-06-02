import { PageShell } from '@/components/page-shell';
import { listTopPosts, videosKpis, syncVideos } from '@/lib/actions/videos';
import { listClientes } from '@/lib/actions/clientes';
import { Film, RefreshCw, Eye, Bookmark, Share2, Heart, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SORTS = [
  { key: 'reach', label: 'Alcance' },
  { key: 'plays', label: 'Reproducciones' },
  { key: 'engagementRate', label: 'Engagement' },
  { key: 'saves', label: 'Guardados' },
  { key: 'shares', label: 'Compartidos' },
] as const;
type SortKey = (typeof SORTS)[number]['key'];

const compact = (v: unknown) => {
  const n = Number(v) || 0;
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : String(n);
};

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ client?: string; sort?: string }> }) {
  const { client, sort } = await searchParams;
  const clientId = client ? Number(client) : undefined;
  const sortKey = (SORTS.find((s) => s.key === sort)?.key ?? 'reach') as SortKey;
  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    if (clientId) p.set('client', String(clientId));
    if (sortKey !== 'reach') p.set('sort', sortKey);
    for (const [k, v] of Object.entries(extra)) { if (v == null) p.delete(k); else p.set(k, String(v)); }
    const s = p.toString();
    return s ? `/videos?${s}` : '/videos';
  };

  const [clientes, posts, k] = await Promise.all([
    listClientes(), listTopPosts({ clientId, sort: sortKey, onlyReels: true }), videosKpis({ clientId }),
  ]);

  const kpis = [
    { label: 'Reels', value: compact(k.posts), icon: Film },
    { label: 'Alcance total', value: compact(k.reach), icon: Eye },
    { label: 'Reproducciones', value: compact(k.plays), icon: Play },
    { label: 'Guardados', value: compact(k.saves), icon: Bookmark },
    { label: 'Eng. prom.', value: `${(Number(k.avgEng) * 100 || 0).toFixed(1)}%`, icon: Heart },
  ];

  return (
    <PageShell kicker="Reels / IG" title="Video Analytics" actions={
      clientId ? (
        <form action={async () => { 'use server'; await syncVideos(clientId); }}>
          <button type="submit" className="btn-primary text-sm shadow-flame flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Sincronizar
          </button>
        </form>
      ) : null
    }>
      {/* filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <a href={qs({ client: undefined })} className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${!clientId ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>Todos</a>
        {clientes.map((c) => (
          <a key={c.id} href={qs({ client: c.id })} className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 ${clientId === c.id ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>
            {c.color && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}{c.nombre}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs text-fervor-smoke font-mono uppercase tracking-wider mr-1">Ordenar:</span>
        {SORTS.map((s) => (
          <a key={s.key} href={qs({ sort: s.key === 'reach' ? undefined : s.key })} className={`px-2.5 py-1 rounded text-xs ${sortKey === s.key ? 'bg-fervor-flame/15 text-fervor-flame' : 'text-fervor-smoke hover:text-fervor-ash'}`}>{s.label}</a>
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

      {/* grid reels */}
      {posts.length === 0 ? (
        <div className="card text-center py-16">
          <Film className="h-10 w-10 text-fervor-flame/40 mx-auto mb-3" />
          <div className="text-fervor-paper font-medium mb-1">Sin reels sincronizados</div>
          <div className="text-fervor-smoke text-sm mb-5">
            {clientId ? 'Tocá Sincronizar para traer los reels de Instagram.' : 'Elegí un cliente y sincronizá, o conectá su IG Business en /config.'}
          </div>
          <a href="/config" className="btn-secondary text-sm">Conectar IG</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((p, i) => (
            <a key={p.id} href={p.permalink || '#'} target="_blank" rel="noreferrer"
               className="card card-hover p-0 overflow-hidden group">
              <div className="relative aspect-[4/5] bg-fervor-ink-3">
                {p.thumbnailUrl
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  : <div className="w-full h-full flex items-center justify-center"><Film className="h-8 w-8 text-fervor-flame/30" /></div>}
                <div className="absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-fervor-flame">#{i + 1}</div>
                {p.color && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-black/40" style={{ background: p.color }} />}
              </div>
              <div className="p-3">
                <div className="text-xs text-fervor-ash line-clamp-2 mb-2 min-h-[2rem]">{p.caption || '(sin texto)'}</div>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-fervor-smoke">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{compact(p.reach)}</span>
                  <span className="flex items-center gap-1"><Play className="h-3 w-3" />{compact(p.plays)}</span>
                  <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{compact(p.saves)}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{compact(p.likes)}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{compact(p.shares)}</span>
                  <span className="flex items-center gap-1 text-fervor-flame">{(Number(p.engagementRate) * 100 || 0).toFixed(1)}%</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </PageShell>
  );
}
