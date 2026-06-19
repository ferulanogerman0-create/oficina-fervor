import { PageShell } from '@/components/page-shell';
import { db, schema } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { Bug } from 'lucide-react';

export const dynamic = 'force-dynamic';

const APP_LABEL: Record<string, string> = {
  tutaller: 'TuTaller.app', agenciafacil: 'Agencia Fácil', fma: 'FMA app', oficina: 'Oficina',
};
const ESTADOS = ['nuevo', 'revisado', 'resuelto', 'descartado'] as const;
const ESTADO_COLOR: Record<string, string> = {
  nuevo: 'text-fervor-flame bg-fervor-flame/10 border-fervor-flame/30',
  revisado: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  resuelto: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  descartado: 'text-fervor-smoke bg-fervor-ink-3 border-fervor-border',
};

async function setEstado(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  const estado = String(formData.get('estado'));
  if (id && ESTADOS.includes(estado as any)) {
    await db.update(schema.bugReports).set({ estado }).where(eq(schema.bugReports.id, id));
    revalidatePath('/soporte');
  }
}

export default async function SoportePage() {
  const reports = await db.select().from(schema.bugReports).orderBy(desc(schema.bugReports.createdAt)).limit(200);
  const nuevos = reports.filter((r) => r.estado === 'nuevo').length;

  return (
    <PageShell kicker="Reportes de las apps" title="Soporte">
      <div className="mb-5 text-sm text-fervor-smoke">
        {reports.length} reportes · <span className="text-fervor-flame font-semibold">{nuevos} nuevos</span>
      </div>

      <div className="space-y-3">
        {reports.length === 0 && (
          <div className="card py-12 text-center text-fervor-smoke">
            <Bug className="h-8 w-8 mx-auto mb-3 opacity-40" />
            Sin reportes todavía.
          </div>
        )}
        {reports.map((r) => (
          <div key={r.id} className={`card ${r.estado === 'resuelto' || r.estado === 'descartado' ? 'opacity-55' : ''}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-fervor-ink-3 text-fervor-ash">
                  {APP_LABEL[r.app] || r.app}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${ESTADO_COLOR[r.estado] || ''}`}>
                  {r.estado}
                </span>
                <span className="text-[10px] text-fervor-smoke font-mono">#{r.id}</span>
              </div>
              <span className="text-[11px] text-fervor-smoke whitespace-nowrap">
                {new Date(r.createdAt).toLocaleString('es-AR')}
              </span>
            </div>

            <p className="text-sm text-fervor-paper whitespace-pre-wrap leading-relaxed">{r.mensaje}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-fervor-smoke font-mono">
              {r.usuario && <span>👤 {r.usuario}</span>}
              {r.contacto && <span>📩 {r.contacto}</span>}
              {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-fervor-flame/80 hover:underline truncate max-w-[280px]">🔗 {r.url}</a>}
            </div>

            {r.nota && <div className="mt-2 text-xs text-amber-300/90 bg-amber-400/5 border-l-2 border-amber-400/40 px-3 py-2 rounded">{r.nota}</div>}

            <div className="flex items-center gap-1.5 mt-3">
              {ESTADOS.map((e) => (
                <form key={e} action={setEstado}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="estado" value={e} />
                  <button type="submit"
                    className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded border transition-colors
                      ${r.estado === e ? ESTADO_COLOR[e] : 'border-fervor-border text-fervor-smoke hover:text-fervor-ash'}`}>
                    {e}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
