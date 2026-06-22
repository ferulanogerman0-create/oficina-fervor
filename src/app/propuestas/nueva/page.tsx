import { Sidebar } from '@/components/sidebar';
import { SERVICIOS } from '@/lib/propuestas/catalog';
import { createPropuesta } from '@/lib/actions/propuestas';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NuevaPropuestaPage() {
  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-fervor-border flex items-center gap-4">
          <Link href="/propuestas" className="text-fervor-smoke hover:text-fervor-flame"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <div className="kicker mb-1">Comercial</div>
            <h1 className="font-display text-3xl font-bold text-fervor-paper">Nueva propuesta</h1>
          </div>
        </header>

        <form action={createPropuesta} className="p-8 max-w-3xl space-y-6">
          {/* Cliente */}
          <div className="card space-y-4">
            <div className="kicker">Cliente</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1.5 block">
                <div className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Nombre*</div>
                <input name="client_name" required className="input" placeholder="Germán Ferulano" />
              </label>
              <label className="space-y-1.5 block">
                <div className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Email</div>
                <input name="client_email" type="email" className="input" placeholder="cliente@email.com" />
              </label>
              <label className="space-y-1.5 block md:col-span-2">
                <div className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Negocio / Rubro</div>
                <input name="client_negocio" className="input" placeholder="Taller mecánico de Campana" />
              </label>
            </div>
          </div>

          {/* Servicios */}
          <div className="card space-y-3">
            <div className="kicker">Servicios — tildá los que apliquen</div>
            <p className="text-xs text-fervor-smoke">Los precios pre-cargados son el rango sugerido. Ajustá setup/MRR según escope acordado.</p>
            <div className="space-y-2">
              {SERVICIOS.map((s) => {
                const setupAvg = Math.round((s.setupMin + s.setupMax) / 2);
                const mrrAvg = Math.round((s.mrrMin + s.mrrMax) / 2);
                return (
                  <details key={s.key} className="card bg-fervor-ink-3 border border-fervor-border-soft">
                    <summary className="cursor-pointer flex items-center gap-3 list-none">
                      <input type="checkbox" name="servicio_key" value={s.key} className="h-4 w-4 accent-fervor-flame" />
                      <div className="flex-1">
                        <div className="font-display text-base text-fervor-paper">{s.label}</div>
                        <div className="text-[11px] font-mono text-fervor-smoke uppercase tracking-wider">
                          Setup ~{s.setupMin}-{s.setupMax} · MRR ~{s.mrrMin}-{s.mrrMax}
                        </div>
                      </div>
                    </summary>
                    <div className="mt-3 pl-7 space-y-2">
                      <p className="text-xs text-fervor-ash/80">{s.descripcion}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs">
                          <span className="font-mono text-fervor-flame">SETUP</span>
                          <input name="servicio_setup" type="number" step="any" defaultValue={setupAvg} min="0" className="input mt-0.5 text-sm" />
                        </label>
                        <label className="text-xs">
                          <span className="font-mono text-fervor-flame">MRR / mes</span>
                          <input name="servicio_mrr" type="number" step="any" defaultValue={mrrAvg} min="0" className="input mt-0.5 text-sm" />
                        </label>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
            <p className="text-[10px] font-mono text-fervor-smoke uppercase tracking-wider">
              Cómo funciona el form: cada acordeón ABIERTO con su checkbox tildado se incluye en la propuesta. Setup/MRR son por servicio. Totales se calculan al crear.
            </p>
          </div>

          {/* Config */}
          <div className="card space-y-3">
            <div className="kicker">Configuración</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="space-y-1.5 block">
                <div className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Moneda</div>
                <select name="currency" defaultValue="USD" className="input">
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </label>
              <label className="space-y-1.5 block">
                <div className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Validez (días)</div>
                <input name="validity_days" type="number" defaultValue={7} min={1} max={60} className="input" />
              </label>
            </div>
            <label className="space-y-1.5 block">
              <div className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Notas internas (no se imprimen)</div>
              <textarea name="notas_internas" rows={2} className="input" placeholder="Contexto sobre este cliente, acuerdo verbal, etc." />
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary shadow-flame">Generar propuesta</button>
            <Link href="/propuestas" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
