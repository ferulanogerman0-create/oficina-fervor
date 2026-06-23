import { PageShell } from '@/components/page-shell';
import { importLinkedinCsv } from '@/lib/actions/import';
import { Linkedin, Upload, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ERROR_MSG: Record<string, string> = {
  nofile: 'No se seleccionó ningún archivo.',
  noself: 'Falta la cuenta propia de FERVOR en la base.',
  format: 'No es un Connections.csv válido (no se encontró la fila de encabezados).',
};

export default async function ImportarPage({ searchParams }: { searchParams: Promise<{ imported?: string; skipped?: string; error?: string }> }) {
  const sp = await searchParams;
  const imported = sp.imported ? Number(sp.imported) : null;
  const skipped = sp.skipped ? Number(sp.skipped) : 0;
  const error = sp.error;

  return (
    <PageShell
      kicker="CRM · Contactos"
      title="Importar contactos de LinkedIn"
      actions={<Link href="/crm" className="text-xs font-mono uppercase tracking-wider text-fervor-smoke hover:text-fervor-flame flex items-center gap-1.5"><ArrowLeft size={14} /> Volver al CRM</Link>}
    >
      {imported !== null && (
        <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-400 mt-0.5" size={20} />
          <div className="text-sm">
            <div className="text-emerald-300 font-semibold">{imported} contactos importados al CRM.</div>
            {skipped > 0 && <div className="text-fervor-smoke mt-0.5">{skipped} omitidos (ya estaban cargados).</div>}
            <Link href="/crm" className="text-fervor-flame hover:underline mt-1 inline-block">Verlos en el CRM →</Link>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-alert/30 bg-alert/10 p-4 flex items-start gap-3">
          <AlertTriangle className="text-alert mt-0.5" size={20} />
          <div className="text-sm text-fervor-ash">{ERROR_MSG[error] || 'Ocurrió un error al importar.'}</div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Pasos */}
        <div className="rounded-xl border border-fervor-border bg-fervor-ink-2 p-6">
          <div className="flex items-center gap-2 text-fervor-flame mb-4">
            <Linkedin size={20} />
            <span className="font-mono text-xs uppercase tracking-wider">Cómo obtener el archivo</span>
          </div>
          <ol className="space-y-3 text-sm text-fervor-ash list-decimal list-inside">
            <li>LinkedIn → <b>Configuración</b> → <b>Privacidad de datos</b>.</li>
            <li><b>Obtené una copia de tus datos</b>.</li>
            <li>Tildá <b>Conexiones</b> (o la export grande que incluye contactos) → <b>Solicitar archivo</b>.</li>
            <li>Te llega un mail con un <b>ZIP</b>. Descomprimilo y buscá <b>Connections.csv</b>.</li>
            <li>Subilo acá → cada contacto entra como <b>lead</b> (fuente: LinkedIn).</li>
          </ol>
          <p className="text-xs text-fervor-smoke mt-4">Idempotente: si volvés a subir el mismo archivo, no se duplican. Deduplica por email y por nombre.</p>
        </div>

        {/* Upload */}
        <form action={importLinkedinCsv} className="rounded-xl border border-fervor-border bg-fervor-ink-2 p-6">
          <div className="flex items-center gap-2 text-fervor-flame mb-4">
            <Upload size={20} />
            <span className="font-mono text-xs uppercase tracking-wider">Subir Connections.csv</span>
          </div>
          <label className="block">
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm text-fervor-ash file:mr-4 file:rounded-lg file:border-0 file:bg-fervor-flame file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-black hover:file:bg-fervor-flame-l file:cursor-pointer cursor-pointer rounded-lg border border-fervor-border bg-fervor-ink-3 p-3"
            />
          </label>
          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-fervor-flame px-4 py-3 text-sm font-semibold text-black hover:bg-fervor-flame-l transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={16} /> Importar al CRM
          </button>
          <p className="text-xs text-fervor-smoke mt-3">Se cargan en la cuenta propia de FERVOR, etapa "Nuevo".</p>
        </form>
      </div>
    </PageShell>
  );
}
