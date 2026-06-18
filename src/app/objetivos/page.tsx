import { Sidebar } from '@/components/sidebar';
import { getObjetivosActivos, updateObjetivoActual } from '@/lib/actions/habits';
import Link from 'next/link';
import { Plus, Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ObjetivosPage() {
  const objetivos = await getObjetivosActivos();

  async function updateActual(fd: FormData) {
    'use server';
    const id = Number(fd.get('id'));
    const v = String(fd.get('valor') || '0');
    await updateObjetivoActual(id, v);
  }

  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-fervor-border flex items-center justify-between">
          <div>
            <div className="kicker mb-1">Estrategia 90 días</div>
            <h1 className="font-display text-3xl font-bold text-fervor-paper">Objetivos</h1>
          </div>
          <Link href="/objetivos/nuevo" className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Objetivo
          </Link>
        </header>

        <div className="p-8 space-y-4">
          {objetivos.length === 0 ? (
            <div className="card text-center py-16">
              <Trophy className="h-12 w-12 text-fervor-smoke mx-auto mb-3" />
              <div className="text-fervor-smoke">Sin objetivos activos.</div>
              <div className="mt-3">
                <Link href="/objetivos/nuevo" className="btn-primary text-sm">Crear primer objetivo</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {objetivos.map((o) => {
                const actual = Number(o.kpiActual) || 0;
                const target = Number(o.kpiTarget) || 0;
                const pct = target ? Math.min(100, Math.round((actual / target) * 100)) : 0;
                const diasRestantes = Math.max(0, Math.ceil((new Date(o.fechaFin + 'T23:59').getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                return (
                  <div key={o.id} className="card" style={{ borderTop: `4px solid ${o.color}` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="kicker mb-1" style={{ color: o.color || '#FF5A1F' }}>
                          {o.tipo} · {o.categoria || 'general'}
                        </div>
                        <h3 className="font-display text-xl text-fervor-paper">{o.titulo}</h3>
                      </div>
                    </div>
                    {o.descripcion && <p className="text-sm text-fervor-ash/80 mb-3">{o.descripcion}</p>}

                    <div className="space-y-2 mb-3">
                      <div className="flex items-baseline justify-between">
                        <span className="font-display text-3xl font-bold text-fervor-paper">{actual.toLocaleString('es-AR')}</span>
                        <span className="text-fervor-smoke text-sm">de {target.toLocaleString('es-AR')} {o.kpiUnidad}</span>
                      </div>
                      <div className="h-2 bg-fervor-ink-3 rounded-full overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: o.color || '#FF5A1F' }} />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider">
                        <span className="text-fervor-flame">{pct}%</span>
                        <span className="text-fervor-smoke">{diasRestantes} días restantes</span>
                      </div>
                    </div>

                    <form action={updateActual} className="flex gap-2">
                      <input type="hidden" name="id" value={o.id} />
                      <input
                        name="valor"
                        type="number"
                        step="any"
                        defaultValue={actual}
                        className="input flex-1 text-sm"
                        placeholder="Actualizar valor actual"
                      />
                      <button className="btn-secondary text-sm">Update</button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
