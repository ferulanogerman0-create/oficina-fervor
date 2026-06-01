import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { createCliente } from '@/lib/actions/clientes';
import { ArrowLeft } from 'lucide-react';

export default function NuevoClientePage() {
  return (
    <PageShell kicker="Cartera" title="Nuevo cliente">
      <Link href="/clientes" className="text-fervor-smoke hover:text-fervor-flame inline-flex items-center gap-1 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <form action={createCliente} className="card max-w-2xl space-y-4">
        <Row label="Nombre *">
          <input name="nombre" required className="input-field w-full" />
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Slug (auto)">
            <input name="slug" placeholder="fma" className="input-field w-full font-mono text-sm" />
          </Row>
          <Row label="Rubro">
            <input name="rubro" placeholder="Taller / Psicología / ..." className="input-field w-full" />
          </Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Color marca (hex)">
            <input name="color" placeholder="#FF5A1F" className="input-field w-full font-mono" />
          </Row>
          <Row label="WhatsApp">
            <input name="whatsapp" placeholder="+5493489..." className="input-field w-full" />
          </Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Instagram handle">
            <input name="ig_handle" placeholder="@fma_mecatronica" className="input-field w-full" />
          </Row>
          <Row label="FB Page URL">
            <input name="fb_page_url" placeholder="https://facebook.com/..." className="input-field w-full" />
          </Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Estado">
            <select name="estado" defaultValue="activo" className="input-field w-full">
              <option value="activo">Activo</option><option value="pausado">Pausado</option><option value="cerrado">Cerrado</option>
            </select>
          </Row>
          <Row label="Prioridad">
            <select name="prioridad" defaultValue="media" className="input-field w-full">
              <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
            </select>
          </Row>
        </div>
        <Row label="Notas">
          <textarea name="notes" rows={3} className="input-field w-full" />
        </Row>
        <div className="flex justify-end gap-2 pt-2">
          <Link href="/clientes" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary text-sm shadow-flame">Crear cliente</button>
        </div>
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
