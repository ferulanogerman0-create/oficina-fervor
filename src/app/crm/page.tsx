import { PageShell } from '@/components/page-shell';
import { listLeads, moveLead } from '@/lib/actions/leads';
import { ETAPAS_LEAD as ETAPAS } from '@/lib/types';
import { listClientes } from '@/lib/actions/clientes';
import { Phone, Mail, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ETAPA_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', calificado: 'Calificado',
  propuesta: 'Propuesta', cerrado: '🔥 Cerrado', perdido: 'Perdido',
};
const ETAPA_COLOR: Record<string, string> = {
  nuevo: 'text-fervor-flame', contactado: 'text-fervor-ember',
  calificado: 'text-warn', propuesta: 'text-fervor-flame-l',
  cerrado: 'text-ok', perdido: 'text-alert/60',
};

export default async function CrmPage() {
  const [leads, clientes] = await Promise.all([listLeads(), listClientes()]);
  return (
    <PageShell kicker="Pipeline" title="CRM Leads" actions={
      <a href="#nuevo" className="btn-primary text-sm shadow-flame">+ Lead</a>
    }>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {ETAPAS.map((e) => {
          const items = leads.filter((l) => l.estado === e);
          return (
            <div key={e} className="bg-fervor-ink-2 border border-fervor-border rounded-xl p-3 min-h-[140px]">
              <div className="flex items-center justify-between mb-3">
                <div className={`text-xs font-mono uppercase tracking-wider font-bold ${ETAPA_COLOR[e]}`}>
                  {ETAPA_LABEL[e]}
                </div>
                <span className="text-xs text-fervor-smoke font-mono">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((l) => (
                  <div key={l.id} className="bg-fervor-ink-3 border border-fervor-border rounded-lg p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      {l.color && <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />}
                      <span className="text-fervor-smoke text-[10px]">{l.cliente}</span>
                    </div>
                    <div className="font-medium text-fervor-paper mb-1">{l.nombre}</div>
                    {l.telefono && <div className="flex items-center gap-1 text-fervor-smoke"><Phone className="h-3 w-3" />{l.telefono}</div>}
                    {l.email && <div className="flex items-center gap-1 text-fervor-smoke truncate"><Mail className="h-3 w-3" />{l.email}</div>}
                    {l.motivo && <div className="text-fervor-smoke mt-1 line-clamp-2">{l.motivo}</div>}
                    {/* avanzar estado */}
                    <NextStageButton id={l.id} current={e} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div id="nuevo" className="card max-w-xl">
        <div className="kicker mb-1">Nuevo lead</div>
        <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Cargar</h2>
        <form action={async (fd) => { 'use server'; const { createLead } = await import('@/lib/actions/leads'); await createLead(fd); }}
              className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-mono uppercase tracking-wider text-fervor-smoke">Cliente
            <select name="client_id" required className="input-field w-full mt-1.5 normal-case font-sans tracking-normal">
              <option value="">Elegir cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Nombre
            <input name="nombre" required className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Teléfono
            <input name="telefono" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Email
            <input name="email" type="email" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Fuente
            <select name="fuente" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal">
              <option value="">—</option><option value="ads">Ads</option><option value="organico">Orgánico</option>
              <option value="referido">Referido</option><option value="dm">DM</option><option value="wa">WhatsApp</option>
            </select>
          </label>
          <label className="col-span-2 text-xs font-mono uppercase tracking-wider text-fervor-smoke">Motivo
            <input name="motivo" className="input-field w-full mt-1.5 normal-case font-sans tracking-normal" />
          </label>
          <button type="submit" className="btn-primary col-span-2 shadow-flame">Crear lead</button>
        </form>
      </div>
    </PageShell>
  );
}

function NextStageButton({ id, current }: { id: number; current: string }) {
  const order = ['nuevo','contactado','calificado','propuesta','cerrado'] as const;
  const idx = order.indexOf(current as typeof order[number]);
  if (idx < 0 || idx >= order.length - 1) return null;
  const next = order[idx + 1];
  return (
    <form action={async () => { 'use server'; await moveLead(id, next); }} className="mt-2">
      <button type="submit" className="text-fervor-flame hover:text-fervor-flame-l text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
        → {next} <ChevronRight className="h-3 w-3" />
      </button>
    </form>
  );
}
