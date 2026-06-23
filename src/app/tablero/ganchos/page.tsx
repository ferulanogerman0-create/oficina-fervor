import { PageShell } from '@/components/page-shell';
import Link from 'next/link';
import { listGanchos, crearGancho, toggleFavGancho, deleteGancho, usarGanchoForm } from '@/lib/actions/ganchos';
import { aiEnabled } from '@/lib/ai';
import { Star, Trash2, Eye, ExternalLink, Sparkles, Wand2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const NICHOS = ['automotriz', 'saas', 'agencias', 'contable', 'marketing', 'general'];
const TIPOS = ['pregunta', 'contraste', 'lista', 'historia', 'dato', 'polemica', 'promesa'];
const TIPO_BADGE: Record<string, string> = {
  pregunta: 'bg-fervor-flame/15 text-fervor-flame', contraste: 'bg-fervor-ember/15 text-fervor-ember',
  lista: 'bg-warn/15 text-warn', historia: 'bg-alert/15 text-alert',
  dato: 'bg-ok/15 text-ok', polemica: 'bg-red-500/15 text-red-400', promesa: 'bg-fervor-flame/15 text-fervor-flame',
};

function fmtViews(v: number | null) {
  if (!v) return null;
  if (v >= 1_000_000) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return `${v}`;
}

export default async function GanchosPage({ searchParams }: { searchParams: Promise<{ q?: string; nicho?: string; tipo?: string; fav?: string }> }) {
  const sp = await searchParams;
  const ganchos = await listGanchos({ q: sp.q, nicho: sp.nicho, tipo: sp.tipo, soloFav: sp.fav === '1' });

  return (
    <PageShell kicker="Tablero · Baúl de ganchos" title="Baúl de Ganchos" actions={
      <Link href="/tablero" className="btn-secondary text-sm">← Tablero</Link>
    }>
      {/* filtros */}
      <form className="flex items-center gap-2 mb-4 flex-wrap" method="GET">
        <input name="q" defaultValue={sp.q || ''} placeholder="Buscar gancho…" className="input-field text-sm w-56 normal-case font-sans tracking-normal" />
        <select name="nicho" defaultValue={sp.nicho || ''} className="input-field text-sm normal-case font-sans tracking-normal">
          <option value="">Todos los nichos</option>{NICHOS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select name="tipo" defaultValue={sp.tipo || ''} className="input-field text-sm normal-case font-sans tracking-normal">
          <option value="">Todos los tipos</option>{TIPOS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-fervor-smoke font-mono uppercase">
          <input type="checkbox" name="fav" value="1" defaultChecked={sp.fav === '1'} /> Favoritos
        </label>
        <button className="btn-secondary text-sm">Filtrar</button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {ganchos.map((g) => {
          const angulos = Array.isArray(g.angulos) ? (g.angulos as string[]) : [];
          return (
            <div key={g.id} className="card">
              <div className="flex items-start gap-2 mb-2">
                {g.tipo && <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${TIPO_BADGE[g.tipo] ?? 'bg-fervor-ink-3 text-fervor-smoke'}`}>{g.tipo}</span>}
                {g.nicho && <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-fervor-ink-3 text-fervor-smoke">{g.nicho}</span>}
                {g.usado && <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-ok/15 text-ok">usado</span>}
                <div className="ml-auto flex items-center gap-2 text-fervor-smoke">
                  {fmtViews(g.vistas) && <span className="flex items-center gap-1 text-xs font-mono"><Eye className="h-3 w-3" />{fmtViews(g.vistas)}</span>}
                  <form action={async () => { 'use server'; await toggleFavGancho(g.id); }}>
                    <button className={g.favorito ? 'text-warn' : 'text-fervor-smoke hover:text-warn'}><Star className="h-4 w-4" fill={g.favorito ? 'currentColor' : 'none'} /></button>
                  </form>
                  <form action={async () => { 'use server'; await deleteGancho(g.id); }}>
                    <button className="text-fervor-smoke hover:text-alert"><Trash2 className="h-4 w-4" /></button>
                  </form>
                </div>
              </div>

              <div className="text-sm font-medium text-fervor-paper mb-2 leading-snug">"{g.texto}"</div>

              {g.plantilla && (
                <div className="bg-fervor-ink-3 border-l-2 border-fervor-flame rounded-r-lg px-3 py-2 mb-2">
                  <div className="text-[10px] text-fervor-flame font-mono uppercase tracking-wider mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Plantilla</div>
                  <div className="text-sm text-fervor-ash">{g.plantilla}</div>
                </div>
              )}
              {angulos.length > 0 && (
                <ul className="text-xs text-fervor-smoke space-y-0.5 mb-2 list-disc list-inside">
                  {angulos.slice(0, 3).map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {g.autorHandle && <span className="text-[11px] text-fervor-smoke font-mono">@{g.autorHandle.replace(/^@/, '')}</span>}
                {g.fuenteUrl && <a href={g.fuenteUrl} target="_blank" rel="noreferrer" className="text-fervor-smoke hover:text-fervor-flame"><ExternalLink className="h-3.5 w-3.5" /></a>}
                <form action={usarGanchoForm} className="ml-auto flex items-center gap-1.5">
                  <input type="hidden" name="id" value={g.id} />
                  <select name="formato" defaultValue="reel" className="input-field text-xs py-1 normal-case font-sans tracking-normal">
                    <option value="reel">Reel</option><option value="carrusel">Carrusel</option><option value="post">Post</option><option value="story">Story</option>
                  </select>
                  <select name="plataforma" defaultValue="instagram" className="input-field text-xs py-1 normal-case font-sans tracking-normal">
                    <option value="instagram">IG</option><option value="tiktok">TikTok</option><option value="youtube">YT</option><option value="linkedin">LinkedIn</option>
                  </select>
                  <button className="btn-primary text-xs flex items-center gap-1 shadow-flame"><Wand2 className="h-3.5 w-3.5" /> Usar éste</button>
                </form>
              </div>
            </div>
          );
        })}
        {ganchos.length === 0 && <div className="text-sm text-fervor-smoke/50 col-span-full text-center py-10">Baúl vacío. Cargá tu primer gancho abajo.</div>}
      </div>

      {/* nuevo gancho */}
      <div id="nuevo" className="card max-w-2xl">
        <div className="kicker mb-1">Nuevo gancho</div>
        <h2 className="font-display text-lg font-bold text-fervor-paper mb-1">Guardar al baúl</h2>
        <p className="text-xs text-fervor-smoke mb-4">{aiEnabled() ? 'La IA lo convierte en plantilla reusable + ángulos al guardar.' : '⚠️ Falta ANTHROPIC_API_KEY: se guarda sin plantilla IA.'}</p>
        <form action={crearGancho} className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-mono uppercase tracking-wider text-fervor-smoke">Gancho / transcripción
            <textarea name="texto" required rows={2} placeholder='"Si tu negocio depende de vos, no tenés un negocio, tenés un trabajo"' className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Autor (@)
            <input name="autor_handle" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Vistas
            <input name="vistas" type="number" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Plataforma
            <select name="plataforma" defaultValue="instagram" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal">
              <option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="linkedin">LinkedIn</option>
            </select>
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Link fuente
            <input name="fuente_url" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Nicho (opcional)
            <select name="nicho" defaultValue="" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal">
              <option value="">Auto (IA)</option>{NICHOS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Tipo (opcional)
            <select name="tipo" defaultValue="" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal">
              <option value="">Auto (IA)</option>{TIPOS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="submit" className="btn-primary col-span-2 shadow-flame">Guardar al baúl</button>
        </form>
      </div>
    </PageShell>
  );
}
