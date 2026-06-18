import { Sidebar } from '@/components/sidebar';
import { getObjetivosActivos, createHabito } from '@/lib/actions/habits';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NuevoHabito() {
  const objetivos = await getObjetivosActivos();

  async function submit(fd: FormData) {
    'use server';
    const titulo = String(fd.get('titulo') || '').trim();
    if (!titulo) return;
    const frecuencia = String(fd.get('frecuencia') || 'diaria') as any;
    const diasArr: string[] = [];
    for (const d of ['1', '2', '3', '4', '5', '6', '0']) {
      if (fd.get(`dia_${d}`)) diasArr.push(d);
    }
    await createHabito({
      titulo,
      descripcion: String(fd.get('descripcion') || '') || undefined,
      categoria: String(fd.get('categoria') || 'admin'),
      frecuencia,
      diasSemana: diasArr.length ? diasArr.join(',') : undefined,
      diaMes: fd.get('dia_mes') ? Number(fd.get('dia_mes')) : undefined,
      horaDefault: String(fd.get('hora') || '09:00'),
      tiempoEstimadoMin: Number(fd.get('tiempo') || 30),
      objetivoId: fd.get('objetivo_id') ? Number(fd.get('objetivo_id')) : undefined,
      emoji: String(fd.get('emoji') || '') || undefined,
      syncGcal: fd.get('sync_gcal') === 'on',
    });
    redirect('/habitos');
  }

  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-fervor-border flex items-center gap-4">
          <Link href="/habitos" className="text-fervor-smoke hover:text-fervor-flame"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-3xl font-bold text-fervor-paper">Nuevo hábito</h1>
        </header>

        <form action={submit} className="p-8 max-w-2xl space-y-5">
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <label className="space-y-1.5">
              <div className="kicker">Emoji</div>
              <input name="emoji" maxLength={4} placeholder="🔥" className="input text-2xl text-center" />
            </label>
            <label className="space-y-1.5">
              <div className="kicker">Título</div>
              <input name="titulo" required className="input" placeholder="Ej: 10 connection requests LinkedIn" />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <div className="kicker">Descripción</div>
            <textarea name="descripcion" rows={3} className="input" placeholder="Detalle del hábito..." />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <div className="kicker">Categoría</div>
              <select name="categoria" className="input" defaultValue="captacion">
                <option value="captacion">Captación</option>
                <option value="contenido">Contenido</option>
                <option value="delivery">Delivery</option>
                <option value="admin">Admin</option>
                <option value="personal">Personal</option>
              </select>
            </label>
            <label className="space-y-1.5 block">
              <div className="kicker">Frecuencia</div>
              <select name="frecuencia" className="input" defaultValue="diaria">
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal (un día específico)</option>
                <option value="mensual">Mensual (día del mes)</option>
              </select>
            </label>
          </div>

          <fieldset className="card">
            <legend className="kicker px-2">Días de la semana</legend>
            <div className="grid grid-cols-7 gap-1.5">
              {[
                { d: '1', label: 'Lun' }, { d: '2', label: 'Mar' }, { d: '3', label: 'Mié' },
                { d: '4', label: 'Jue' }, { d: '5', label: 'Vie' }, { d: '6', label: 'Sáb' }, { d: '0', label: 'Dom' },
              ].map((x) => (
                <label key={x.d} className="flex flex-col items-center cursor-pointer">
                  <input type="checkbox" name={`dia_${x.d}`} defaultChecked={['1', '2', '3', '4', '5'].includes(x.d)} className="peer sr-only" />
                  <div className="w-full text-center py-2 rounded bg-fervor-ink-3 border border-fervor-border peer-checked:bg-fervor-flame peer-checked:border-fervor-flame peer-checked:text-white text-fervor-smoke text-sm font-mono uppercase">
                    {x.label}
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-fervor-smoke mt-2">Si frecuencia es mensual, los días de la semana se ignoran.</p>
          </fieldset>

          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1.5 block">
              <div className="kicker">Hora</div>
              <input name="hora" type="time" defaultValue="09:00" className="input" />
            </label>
            <label className="space-y-1.5 block">
              <div className="kicker">Duración (min)</div>
              <input name="tiempo" type="number" defaultValue={30} min={5} max={480} className="input" />
            </label>
            <label className="space-y-1.5 block">
              <div className="kicker">Día del mes (si mensual)</div>
              <input name="dia_mes" type="number" min={1} max={31} placeholder="1" className="input" />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <div className="kicker">Objetivo vinculado (opcional)</div>
            <select name="objetivo_id" className="input">
              <option value="">— sin vincular —</option>
              {objetivos.map((o) => (
                <option key={o.id} value={o.id}>{o.titulo}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 card cursor-pointer">
            <input type="checkbox" name="sync_gcal" defaultChecked className="h-4 w-4 accent-fervor-flame" />
            <div>
              <div className="text-sm text-fervor-paper">Crear evento recurrente en Google Calendar</div>
              <div className="text-xs text-fervor-smoke">Recordatorio popup 10 min antes</div>
            </div>
          </label>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">Guardar hábito</button>
            <Link href="/habitos" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
