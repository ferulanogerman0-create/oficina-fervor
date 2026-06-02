import { PageShell } from '@/components/page-shell';
import { listIdeas, moveIdea, createIdea } from '@/lib/actions/contenido';
import { ESTADOS_IDEA as ESTADOS } from '@/lib/types';
import { listClientes } from '@/lib/actions/clientes';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ESTADO_LABEL: Record<string, string> = { idea: 'Idea', produccion: 'En producción', aprobado: 'Aprobado', posteado: '🔥 Posteado' };
const ESTADO_COLOR: Record<string, string> = {
  idea: 'text-fervor-smoke', produccion: 'text-fervor-ember',
  aprobado: 'text-warn', posteado: 'text-ok',
};
const FORMATO_BADGE: Record<string, string> = {
  carrusel: 'bg-fervor-flame/15 text-fervor-flame',
  post: 'bg-fervor-ember/15 text-fervor-ember',
  story: 'bg-warn/15 text-warn',
  reel: 'bg-alert/15 text-alert',
};

export default async function ContenidoPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clientId = client ? Number(client) : undefined;
  const [ideas, clientes] = await Promise.all([listIdeas({ clientId }), listClientes()]);
  return (
    <PageShell kicker="Content board" title="Contenido" actions={
      <a href="#nueva" className="btn-primary text-sm shadow-flame">+ Idea</a>
    }>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <a href="/contenido" className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${!clientId ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>Todos</a>
        {clientes.map((c) => (
          <a key={c.id} href={`/contenido?client=${c.id}`} className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 ${clientId === c.id ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>
            {c.color && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}{c.nombre}
          </a>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
        {ESTADOS.map((e) => {
          const items = ideas.filter((i) => i.estado === e);
          return (
            <div key={e} className="bg-fervor-ink-2 border border-fervor-border rounded-xl p-3 min-h-[180px]">
              <div className="flex items-center justify-between mb-3">
                <div className={`text-xs font-mono uppercase tracking-wider font-bold ${ESTADO_COLOR[e]}`}>{ESTADO_LABEL[e]}</div>
                <span className="text-xs text-fervor-smoke font-mono">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="bg-fervor-ink-3 border border-fervor-border rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {it.color && <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />}
                      <span className="text-[10px] text-fervor-smoke font-mono uppercase">{it.cliente}</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${FORMATO_BADGE[it.formato] ?? FORMATO_BADGE.post}`}>{it.formato}</span>
                    </div>
                    <div className="text-sm font-medium text-fervor-paper mb-1">{it.titulo}</div>
                    {it.hook && <div className="text-xs text-fervor-smoke italic mb-1">"{it.hook}"</div>}
                    <NextEstadoButton id={it.id} current={e} />
                  </div>
                ))}
                {items.length === 0 && <div className="text-xs text-fervor-smoke/40 text-center py-4">vacío</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div id="nueva" className="card max-w-xl">
        <div className="kicker mb-1">Nueva idea</div>
        <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Cargar</h2>
        <form action={createIdea} className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-mono uppercase tracking-wider text-fervor-smoke">Cliente
            <select name="client_id" required className="input-field w-full mt-1.5 normal-case font-sans tracking-normal">
              <option value="">Elegir cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label className="col-span-2 text-xs font-mono uppercase tracking-wider text-fervor-smoke">Título
            <input name="titulo" required className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Formato
            <select name="formato" defaultValue="carrusel" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal">
              <option value="carrusel">Carrusel</option><option value="post">Post</option>
              <option value="story">Story</option><option value="reel">Reel</option>
            </select>
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Hook
            <input name="hook" placeholder="¿Tu auto tira humo?" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="col-span-2 text-xs font-mono uppercase tracking-wider text-fervor-smoke">Notas
            <textarea name="notas" rows={2} className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <button type="submit" className="btn-primary col-span-2 shadow-flame">Encender idea</button>
        </form>
      </div>
    </PageShell>
  );
}

function NextEstadoButton({ id, current }: { id: number; current: string }) {
  const order = ['idea','produccion','aprobado','posteado'] as const;
  const idx = order.indexOf(current as typeof order[number]);
  if (idx < 0 || idx >= order.length - 1) return null;
  const next = order[idx + 1];
  return (
    <form action={async () => { 'use server'; await moveIdea(id, next); }} className="mt-2">
      <button type="submit" className="text-fervor-flame hover:text-fervor-flame-l text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
        → {next} <ChevronRight className="h-3 w-3" />
      </button>
    </form>
  );
}
