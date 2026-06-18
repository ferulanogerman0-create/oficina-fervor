import { Sidebar } from '@/components/sidebar';
import { createObjetivo } from '@/lib/actions/habits';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NuevoObjetivo() {
  async function submit(fd: FormData) {
    'use server';
    const titulo = String(fd.get('titulo') || '').trim();
    if (!titulo) return;
    await createObjetivo({
      titulo,
      descripcion: String(fd.get('descripcion') || '') || undefined,
      tipo: String(fd.get('tipo') || '90d') as any,
      categoria: String(fd.get('categoria') || ''),
      fechaInicio: String(fd.get('inicio')),
      fechaFin: String(fd.get('fin')),
      kpiUnidad: String(fd.get('kpi_unidad') || '') || undefined,
      kpiTarget: String(fd.get('kpi_target') || '0'),
      color: String(fd.get('color') || '#FF5A1F'),
    });
    redirect('/objetivos');
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const en90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-fervor-border flex items-center gap-4">
          <Link href="/objetivos" className="text-fervor-smoke hover:text-fervor-flame"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-3xl font-bold text-fervor-paper">Nuevo objetivo</h1>
        </header>
        <form action={submit} className="p-8 max-w-2xl space-y-5">
          <label className="space-y-1.5 block">
            <div className="kicker">Título</div>
            <input name="titulo" required className="input" placeholder="Ej: MRR FERVOR +$1.500 USD/mes" />
          </label>
          <label className="space-y-1.5 block">
            <div className="kicker">Descripción</div>
            <textarea name="descripcion" rows={3} className="input" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <div className="kicker">Tipo</div>
              <select name="tipo" className="input" defaultValue="90d">
                <option value="90d">90 días</option>
                <option value="anual">Anual</option>
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
              </select>
            </label>
            <label className="space-y-1.5 block">
              <div className="kicker">Categoría</div>
              <select name="categoria" className="input" defaultValue="ingresos">
                <option value="ingresos">Ingresos</option>
                <option value="captacion">Captación</option>
                <option value="contenido">Contenido</option>
                <option value="delivery">Delivery</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <div className="kicker">Fecha inicio</div>
              <input name="inicio" type="date" defaultValue={hoy} className="input" required />
            </label>
            <label className="space-y-1.5 block">
              <div className="kicker">Fecha fin</div>
              <input name="fin" type="date" defaultValue={en90} className="input" required />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <div className="kicker">Unidad KPI</div>
              <input name="kpi_unidad" className="input" placeholder="Ej: USD / clientes / posts" />
            </label>
            <label className="space-y-1.5 block">
              <div className="kicker">Target</div>
              <input name="kpi_target" type="number" step="any" className="input" placeholder="1500" />
            </label>
          </div>
          <label className="space-y-1.5 block">
            <div className="kicker">Color</div>
            <input name="color" type="color" defaultValue="#FF5A1F" className="input h-10" />
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">Crear objetivo</button>
            <Link href="/objetivos" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
