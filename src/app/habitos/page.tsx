import { Sidebar } from '@/components/sidebar';
import { getHabitosHoy, getStreak } from '@/lib/actions/habits';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ToggleCompletionBtn } from './toggle';
import { Plus, Calendar, Flame } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CAT_COLORS: Record<string, string> = {
  captacion: '#FF5A1F',
  contenido: '#FFA53C',
  delivery: '#FF7A3C',
  admin: '#9a9a9a',
  personal: '#A08880',
};

export default async function HabitosPage({ searchParams }: { searchParams: Promise<{ fecha?: string; gcal?: string }> }) {
  const sp = await searchParams;
  const hoy = sp.fecha || new Date().toISOString().slice(0, 10);
  const habitos = await getHabitosHoy(hoy);

  // Compute streaks
  const streaks: Record<number, number> = {};
  await Promise.all(habitos.map(async (h) => { streaks[h.id] = await getStreak(h.id); }));

  // Check GCal connected
  const gcal = await db.select().from(schema.googleCalendarCreds).limit(1);
  const gcalConnected = gcal.length > 0;

  const completados = habitos.filter((h) => h.completion?.completado).length;
  const pct = habitos.length ? Math.round((completados / habitos.length) * 100) : 0;

  const dt = new Date(hoy + 'T12:00:00');
  const dowLabel = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dt.getDay()];
  const fechaLabel = dt.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-fervor-border flex items-center justify-between">
          <div>
            <div className="kicker mb-1">{dowLabel} · {fechaLabel}</div>
            <h1 className="font-display text-3xl font-bold text-fervor-paper">Hábitos del día</h1>
          </div>
          <div className="flex items-center gap-2">
            {!gcalConnected && (
              <Link href="/api/gcal/start" className="btn-secondary text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Conectar Google Calendar
              </Link>
            )}
            <Link href="/habitos/nuevo" className="btn-primary text-sm shadow-flame flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Hábito
            </Link>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {sp.gcal === 'ok' && (
            <div className="card border-fervor-flame bg-fervor-flame/5 text-fervor-flame text-sm">
              ✓ Google Calendar conectado{gcal[0]?.email ? ` (${gcal[0].email})` : ''}.
            </div>
          )}

          {/* Resumen del día */}
          <section className="grid grid-cols-3 gap-3">
            <div className="card">
              <div className="kicker mb-1">Progreso hoy</div>
              <div className="font-display text-4xl font-bold text-fervor-paper">{pct}%</div>
              <div className="text-xs text-fervor-smoke mt-1">{completados}/{habitos.length} hábitos</div>
              <div className="h-2 bg-fervor-ink-3 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-fervor-flame transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="card">
              <div className="kicker mb-1">Total hábitos activos</div>
              <div className="font-display text-4xl font-bold text-fervor-paper">{habitos.length}</div>
              <div className="text-xs text-fervor-smoke mt-1">programados para hoy</div>
            </div>
            <div className="card">
              <div className="kicker mb-1">Mejor streak hoy</div>
              <div className="font-display text-4xl font-bold text-fervor-flame flex items-center gap-2">
                {Math.max(0, ...Object.values(streaks))} <Flame className="h-7 w-7" />
              </div>
              <div className="text-xs text-fervor-smoke mt-1">días consecutivos</div>
            </div>
          </section>

          {/* Lista hábitos */}
          <section className="space-y-2">
            {habitos.length === 0 ? (
              <div className="card text-center py-16 text-fervor-smoke">
                Sin hábitos programados para hoy.
                <div className="mt-3">
                  <Link href="/habitos/nuevo" className="btn-primary text-sm">Crear primer hábito</Link>
                </div>
              </div>
            ) : (
              habitos.map((h) => {
                const done = !!h.completion?.completado;
                const color = h.color || CAT_COLORS[h.categoria] || '#FF5A1F';
                return (
                  <div key={h.id} className={`card flex items-center gap-4 ${done ? 'opacity-60' : ''}`}
                       style={{ borderLeft: `4px solid ${color}` }}>
                    <ToggleCompletionBtn habitoId={h.id} fecha={hoy} done={done} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {h.emoji && <span className="text-xl">{h.emoji}</span>}
                        <h3 className={`font-display text-lg ${done ? 'line-through text-fervor-smoke' : 'text-fervor-paper'}`}>
                          {h.titulo}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-fervor-smoke">
                        <span style={{ color }}>{h.categoria}</span>
                        <span>·</span>
                        <span>{h.horaDefault}</span>
                        <span>·</span>
                        <span>{h.tiempoEstimadoMin}min</span>
                        {streaks[h.id] > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-fervor-flame flex items-center gap-1"><Flame className="h-3 w-3" />{streaks[h.id]}d</span>
                          </>
                        )}
                      </div>
                      {h.descripcion && (
                        <p className="text-sm text-fervor-ash/80 mt-1.5 line-clamp-2">{h.descripcion}</p>
                      )}
                    </div>
                    <Link href={`/habitos/${h.id}`} className="text-xs text-fervor-smoke hover:text-fervor-flame">
                      Editar
                    </Link>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
