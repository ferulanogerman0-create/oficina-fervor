import { PageShell } from '@/components/page-shell';
import { listTareas, createTarea, toggleTarea, deleteTarea } from '@/lib/actions/tareas';
import { listClientes } from '@/lib/actions/clientes';
import { Trash2, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CAT_COLOR: Record<string, string> = {
  ads: 'text-fervor-flame bg-fervor-flame/10',
  contenido: 'text-fervor-ember bg-fervor-ember/10',
  crm: 'text-ok bg-ok/10',
  admin: 'text-fervor-smoke bg-fervor-ink-3',
};
const PRIO_COLOR: Record<string, string> = {
  alta: 'border-alert/40 text-alert',
  media: 'border-fervor-border-soft text-fervor-smoke',
  baja: 'border-fervor-border text-fervor-smoke/60',
};

export default async function TareasPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clientId = client ? Number(client) : undefined;
  const [tareas, clientes] = await Promise.all([listTareas({ clientId }), listClientes()]);
  return (
    <PageShell kicker="Tu día" title="Tareas">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <a href="/tareas" className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${!clientId ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>Todos</a>
        {clientes.map((c) => (
          <a key={c.id} href={`/tareas?client=${c.id}`} className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 ${clientId === c.id ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>
            {c.color && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}{c.nombre}
          </a>
        ))}
      </div>
      <form action={createTarea} className="card mb-6 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">Tarea</label>
          <input name="titulo" required placeholder="Editar reel · llamar lead · ..." className="input-field w-full" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">Cliente</label>
          <select name="client_id" className="input-field w-full">
            <option value="">— sin cliente —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">Categoría</label>
          <select name="categoria" className="input-field w-full">
            <option value="">—</option>
            <option value="ads">Ads</option><option value="contenido">Contenido</option>
            <option value="crm">CRM</option><option value="admin">Admin</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">Prio</label>
          <select name="prioridad" defaultValue="media" className="input-field w-full">
            <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">Vence</label>
          <input name="due_at" type="date" className="input-field w-full text-sm" />
        </div>
        <button type="submit" className="btn-primary md:col-span-1 flex items-center justify-center gap-1 shadow-flame">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <div className="card divide-y divide-fervor-border">
        {tareas.length === 0 && <div className="py-12 text-center text-fervor-smoke">Sin tareas. Encendé la primera ↑</div>}
        {tareas.map((t) => (
          <div key={t.id} className={`flex items-center gap-3 py-3 ${t.done ? 'opacity-40' : ''}`}>
            <form action={async () => { 'use server'; await toggleTarea(t.id); }}>
              <button type="submit"
                className={`w-5 h-5 rounded border-2 ${t.done ? 'bg-fervor-flame border-fervor-flame' : 'border-fervor-border-soft hover:border-fervor-flame'} flex items-center justify-center transition-colors`}>
                {t.done && <span className="text-white text-[10px]">✓</span>}
              </button>
            </form>
            <div className="flex-1 min-w-0">
              <div className={`text-sm text-fervor-paper ${t.done ? 'line-through' : ''}`}>{t.titulo}</div>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono uppercase tracking-wider">
                {t.cliente && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.color || '#FF5A1F' }} />
                    {t.cliente}
                  </span>
                )}
                {t.categoria && <span className={`px-1.5 py-0.5 rounded ${CAT_COLOR[t.categoria]}`}>{t.categoria}</span>}
                <span className={`px-1.5 py-0.5 rounded border ${PRIO_COLOR[t.prioridad ?? 'media']}`}>{t.prioridad}</span>
                {t.dueAt && <span className="text-fervor-smoke">{new Date(t.dueAt).toLocaleDateString('es-AR')}</span>}
              </div>
            </div>
            <form action={async () => { 'use server'; await deleteTarea(t.id); }}>
              <button type="submit" className="text-fervor-smoke/40 hover:text-alert">
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
