import { PageShell } from '@/components/page-shell';
import Link from 'next/link';
import { listTendencias, actualizarTendencias, archivarTendencia, tendenciaAGancho } from '@/lib/actions/tendencias';
import { aiEnabled } from '@/lib/ai';
import { ExternalLink, X, Anchor, RefreshCw, Flame } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CAT: Record<string, { label: string; cls: string }> = {
  gancho: { label: '🪝 Gancho', cls: 'bg-fervor-flame/15 text-fervor-flame border-fervor-flame/40' },
  explicativo: { label: '📚 Explicativo', cls: 'bg-fervor-ember/15 text-fervor-ember border-fervor-ember/40' },
  ignorar: { label: 'Ignorar', cls: 'bg-fervor-ink-3 text-fervor-smoke border-fervor-border' },
};

export default async function TendenciasPage({ searchParams }: { searchParams: Promise<{ utiles?: string }> }) {
  const sp = await searchParams;
  const soloUtiles = sp.utiles !== '0';
  const items = await listTendencias({ soloUtiles });

  return (
    <PageShell kicker="Tablero · Tendencias" title="Tendencias" actions={
      <div className="flex items-center gap-2">
        <form action={async () => { 'use server'; await actualizarTendencias(); }}>
          <button className="btn-primary text-sm flex items-center gap-2 shadow-flame"><RefreshCw className="h-4 w-4" /> Actualizar</button>
        </form>
        <Link href="/tablero" className="btn-secondary text-sm">← Tablero</Link>
      </div>
    }>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Link href="/tablero/tendencias?utiles=1" className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${soloUtiles ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke'}`}>Útiles (50+)</Link>
        <Link href="/tablero/tendencias?utiles=0" className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border ${!soloUtiles ? 'border-fervor-flame text-fervor-flame' : 'border-fervor-border text-fervor-smoke'}`}>Todas</Link>
        <span className="text-xs text-fervor-smoke ml-auto">{aiEnabled() ? '12 fuentes · IA clasifica por potencial de contenido' : '⚠️ Falta ANTHROPIC_API_KEY p/ clasificar'}</span>
      </div>

      <div className="space-y-2.5">
        {items.map((t) => {
          const cat = CAT[t.categoria] ?? CAT.ignorar;
          return (
            <div key={t.id} className="card flex items-start gap-4">
              <div className="flex flex-col items-center justify-center w-14 flex-shrink-0">
                <div className="font-display text-2xl font-bold text-fervor-flame leading-none flex items-center gap-0.5">
                  {t.potencial >= 75 && <Flame className="h-4 w-4" />}{t.potencial}
                </div>
                <div className="text-[9px] text-fervor-smoke font-mono uppercase">potencial</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase ${cat.cls}`}>{cat.label}</span>
                  <span className="text-[10px] text-fervor-smoke font-mono uppercase">{t.fuente}</span>
                </div>
                <div className="text-sm font-medium text-fervor-paper mb-1 leading-snug">{t.titulo}</div>
                {t.resumen && <div className="text-xs text-fervor-smoke">{t.resumen}</div>}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="text-fervor-smoke hover:text-fervor-flame" title="Abrir"><ExternalLink className="h-4 w-4" /></a>}
                <form action={async () => { 'use server'; await tendenciaAGancho(t.id); }}>
                  <button className="text-fervor-smoke hover:text-fervor-flame" title="Mandar al Baúl"><Anchor className="h-4 w-4" /></button>
                </form>
                <form action={async () => { 'use server'; await archivarTendencia(t.id); }}>
                  <button className="text-fervor-smoke hover:text-alert" title="Archivar"><X className="h-4 w-4" /></button>
                </form>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-sm text-fervor-smoke/50 text-center py-12">
            Sin tendencias todavía. Tocá <b className="text-fervor-flame">Actualizar</b> para traer las 12 fuentes (tarda ~30s).
          </div>
        )}
      </div>
    </PageShell>
  );
}
