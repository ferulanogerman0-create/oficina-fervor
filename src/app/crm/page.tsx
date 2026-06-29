import { PageShell } from '@/components/page-shell';
import { listLeads } from '@/lib/actions/leads';
import { listClientes } from '@/lib/actions/clientes';
import { CrmBoard } from '@/components/crm-board';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clientId = client ? Number(client) : undefined;
  const [leads, clientes] = await Promise.all([listLeads({ clientId }), listClientes()]);
  return (
    <PageShell kicker="Pipeline" title="CRM Leads" actions={
      <div className="flex items-center gap-2">
        <Link href="/crm/importar" className="px-3 py-1.5 rounded-lg text-sm border border-fervor-border text-fervor-smoke hover:text-fervor-flame hover:border-fervor-flame transition-colors">Importar LinkedIn</Link>
        <a href="#nuevo" className="btn-primary text-sm shadow-flame">+ Lead</a>
      </div>
    }>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <a href="/crm" className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${!clientId ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>Todos</a>
        {clientes.map((c) => (
          <a key={c.id} href={`/crm?client=${c.id}`} className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 ${clientId === c.id ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>
            {c.color && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}{c.nombre}
          </a>
        ))}
      </div>
      <CrmBoard leads={leads} />

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
