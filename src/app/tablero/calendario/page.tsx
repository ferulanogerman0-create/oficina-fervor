import { PageShell } from '@/components/page-shell';
import Link from 'next/link';
import { getMonthItems, getUnscheduled, getIdea, programarIdea, desprogramarIdea, guardarGuion } from '@/lib/actions/calendario';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const PLAT_DOT: Record<string, string> = { instagram: '#E0240A', tiktok: '#fff', youtube: '#FF0000', linkedin: '#0A66C2' };

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ y?: string; m?: string; idea?: string }> }) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getUTCFullYear();
  const month0 = sp.m ? Number(sp.m) : now.getUTCMonth();

  const [items, unscheduled, detalle] = await Promise.all([
    getMonthItems(year, month0),
    getUnscheduled(),
    sp.idea ? getIdea(Number(sp.idea)) : Promise.resolve(null),
  ]);

  // agrupar por día (UTC)
  const byDay: Record<number, typeof items> = {};
  for (const it of items) {
    if (!it.plannedFor) continue;
    const d = new Date(it.plannedFor).getUTCDate();
    (byDay[d] ??= []).push(it);
  }

  const firstDow = (new Date(Date.UTC(year, month0, 1)).getUTCDay() + 6) % 7; // 0=Lun
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevM = month0 === 0 ? { y: year - 1, m: 11 } : { y: year, m: month0 - 1 };
  const nextM = month0 === 11 ? { y: year + 1, m: 0 } : { y: year, m: month0 + 1 };
  const today = now.getUTCFullYear() === year && now.getUTCMonth() === month0 ? now.getUTCDate() : -1;

  return (
    <PageShell kicker="Tablero · Calendario" title="Calendario de Contenido" actions={
      <Link href="/tablero" className="btn-secondary text-sm">← Tablero</Link>
    }>
      <div className="flex gap-4 flex-col xl:flex-row">
        {/* calendario */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xl font-bold text-fervor-paper">{MESES[month0]} {year}</div>
            <div className="flex items-center gap-1">
              <Link href={`/tablero/calendario?y=${prevM.y}&m=${prevM.m}`} className="btn-secondary p-2"><ChevronLeft className="h-4 w-4" /></Link>
              <Link href="/tablero/calendario" className="btn-secondary text-xs px-3">Hoy</Link>
              <Link href={`/tablero/calendario?y=${nextM.y}&m=${nextM.m}`} className="btn-secondary p-2"><ChevronRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DOW.map((d) => <div key={d} className="text-[10px] text-fervor-smoke font-mono uppercase tracking-wider text-center py-1">{d}</div>)}
            {cells.map((day, i) => (
              <div key={i} className={`min-h-[92px] rounded-lg border p-1.5 ${day ? 'bg-fervor-ink-2 border-fervor-border' : 'border-transparent'} ${day === today ? 'ring-1 ring-fervor-flame' : ''}`}>
                {day && <div className={`text-[11px] font-mono mb-1 ${day === today ? 'text-fervor-flame font-bold' : 'text-fervor-smoke'}`}>{day}</div>}
                <div className="space-y-1">
                  {(byDay[day ?? -1] ?? []).map((it) => (
                    <Link key={it.id} href={`/tablero/calendario?y=${year}&m=${month0}&idea=${it.id}`}
                      className="block bg-fervor-ink-3 hover:bg-fervor-flame/10 border border-fervor-border rounded px-1.5 py-1">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PLAT_DOT[it.plataforma || ''] || it.color || '#FF5A1F' }} />
                        <span className="text-[10px] text-fervor-paper truncate">{it.titulo}</span>
                      </div>
                      {it.plannedFor && <div className="text-[9px] text-fervor-smoke font-mono pl-2.5">{new Date(it.plannedFor).toISOString().slice(11, 16)}</div>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* panel derecho */}
        <div className="w-full xl:w-80 flex-shrink-0 space-y-4">
          {detalle ? (
            <div className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="kicker">Guion</div>
                <Link href={`/tablero/calendario?y=${year}&m=${month0}`} className="text-fervor-smoke hover:text-alert"><X className="h-4 w-4" /></Link>
              </div>
              <div className="font-display text-base font-bold text-fervor-paper mb-1">{detalle.titulo}</div>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase text-fervor-smoke">
                <span>{detalle.formato}</span>{detalle.plataforma && <span>· {detalle.plataforma}</span>}<span>· {detalle.estado}</span>
              </div>
              {detalle.hook && <div className="text-xs text-fervor-smoke italic mb-2">Hook: "{detalle.hook}"</div>}
              <form action={guardarGuion}>
                <input type="hidden" name="id" value={detalle.id} />
                <textarea name="guion" rows={12} defaultValue={detalle.guion || ''} placeholder="Guion del contenido…" className="input-field w-full text-xs normal-case font-sans tracking-normal" />
                <div className="flex items-center gap-2 mt-2">
                  <button className="btn-primary text-sm flex-1 shadow-flame">Guardar guion</button>
                  <button formAction={async () => { 'use server'; await desprogramarIdea(detalle.id); }} className="btn-secondary text-xs">Quitar fecha</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card">
              <div className="kicker mb-2 flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Para programar</div>
              {unscheduled.length === 0 && <div className="text-xs text-fervor-smoke/50 py-3">Nada pendiente. Usá un gancho del Baúl → cae acá.</div>}
              <div className="space-y-2.5">
                {unscheduled.map((it) => (
                  <form key={it.id} action={programarIdea} className="bg-fervor-ink-3 border border-fervor-border rounded-lg p-2.5">
                    <input type="hidden" name="id" value={it.id} />
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {it.color && <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />}
                      <span className="text-[10px] text-fervor-smoke font-mono uppercase">{it.formato}{it.plataforma ? ` · ${it.plataforma}` : ''}</span>
                    </div>
                    <div className="text-xs text-fervor-paper mb-2 leading-snug">{it.titulo}</div>
                    <div className="flex items-center gap-1.5">
                      <input type="date" name="fecha" required className="input-field text-[11px] py-1 flex-1 normal-case font-sans tracking-normal" />
                      <input type="time" name="hora" defaultValue="10:00" className="input-field text-[11px] py-1 w-20 normal-case font-sans tracking-normal" />
                    </div>
                    <button className="btn-primary text-[11px] w-full mt-1.5">Programar</button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
