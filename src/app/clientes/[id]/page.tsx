import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { getCliente, updateCliente, deleteCliente } from '@/lib/actions/clientes';
import { ArrowLeft, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cid = Number(id);
  if (!cid) notFound();
  const c = await getCliente(cid);
  if (!c) notFound();

  return (
    <PageShell kicker="Cartera" title={c.nombre} actions={
      <form action={async () => { 'use server'; await deleteCliente(cid); redirect('/clientes'); }}>
        <button type="submit" className="btn-secondary text-sm flex items-center gap-2 text-alert hover:bg-alert/10">
          <Trash2 className="h-4 w-4" /> Borrar
        </button>
      </form>
    }>
      <Link href="/clientes" className="text-fervor-smoke hover:text-fervor-flame inline-flex items-center gap-1 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <form action={updateCliente.bind(null, cid)} className="card max-w-2xl space-y-4">
        <Row label="Nombre"><input name="nombre" defaultValue={c.nombre} required className="input-field w-full" /></Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Slug"><input value={c.slug} disabled className="input-field w-full font-mono text-sm opacity-60" /></Row>
          <Row label="Rubro"><input name="rubro" defaultValue={c.rubro ?? ''} className="input-field w-full" /></Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Color"><input name="color" defaultValue={c.color ?? ''} className="input-field w-full font-mono" /></Row>
          <Row label="WhatsApp"><input name="whatsapp" defaultValue={c.whatsapp ?? ''} className="input-field w-full" /></Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Instagram"><input name="ig_handle" defaultValue={c.igHandle ?? ''} className="input-field w-full" /></Row>
          <Row label="FB Page"><input name="fb_page_url" defaultValue={c.fbPageUrl ?? ''} className="input-field w-full" /></Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Estado">
            <select name="estado" defaultValue={c.estado} className="input-field w-full">
              <option value="activo">Activo</option><option value="pausado">Pausado</option><option value="cerrado">Cerrado</option>
            </select>
          </Row>
          <Row label="Prioridad">
            <select name="prioridad" defaultValue={c.prioridad} className="input-field w-full">
              <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
            </select>
          </Row>
        </div>
        <Row label="Notas"><textarea name="notes" rows={3} defaultValue={c.notes ?? ''} className="input-field w-full" /></Row>
        <button type="submit" className="btn-primary shadow-flame">Guardar</button>
      </form>
    </PageShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">{label}</label>
      {children}
    </div>
  );
}
