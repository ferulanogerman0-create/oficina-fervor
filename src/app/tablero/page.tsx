import { PageShell } from '@/components/page-shell';
import Link from 'next/link';
import { Anchor, CalendarDays, TrendingUp, BarChart3, Telescope, Send, ArrowRight, Lock } from 'lucide-react';
import { ganchosStats } from '@/lib/actions/ganchos';
import { listTendencias } from '@/lib/actions/tendencias';
import { getMonthItems } from '@/lib/actions/calendario';

export const dynamic = 'force-dynamic';

function saludo() {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default async function TableroPage() {
  const now = new Date();
  const [gs, tend, mes] = await Promise.all([
    ganchosStats(),
    listTendencias({ soloUtiles: true }),
    getMonthItems(now.getFullYear(), now.getMonth()),
  ]);

  const cards = [
    { href: '/tablero/ganchos', icon: Anchor, title: 'Baúl de Ganchos', desc: 'Guardás un hook → se vuelve plantilla reusable.', stat: `${gs.total}`, statLabel: 'ganchos', active: true },
    { href: '/tablero/calendario', icon: CalendarDays, title: 'Calendario', desc: 'Todo lo programado, mes a mes, con guion.', stat: `${mes.length}`, statLabel: 'este mes', active: true },
    { href: '/tablero/tendencias', icon: TrendingUp, title: 'Tendencias', desc: '12 fuentes/día, filtradas por potencial.', stat: `${tend.length}`, statLabel: 'útiles', active: true },
    { href: '/metricas', icon: BarChart3, title: 'Métricas', desc: 'Vistas, guardados, seguidores, DMs.', stat: 'BM', statLabel: 'esperando', active: true, soft: true },
    { href: '#', icon: Telescope, title: 'Rastreador Competencia', desc: 'Reels top de cuentas que seguís.', stat: '', statLabel: 'pronto', active: false },
    { href: '#', icon: Send, title: 'Community Manager', desc: 'Publica a IG/TikTok/YT en 1 clic.', stat: '', statLabel: 'pronto', active: false },
  ];

  return (
    <PageShell kicker="Tablero de contenido" title={`${saludo()}, Germán`}>
      <div className="grid grid-cols-3 gap-3 mb-6 max-w-2xl">
        <Stat n={gs.total} label="Ganchos en el baúl" />
        <Stat n={mes.length} label="Programados este mes" />
        <Stat n={tend.length} label="Tendencias útiles hoy" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const inner = (
            <div className={`card h-full flex flex-col transition-colors ${c.active ? 'hover:border-fervor-flame/60 cursor-pointer' : 'opacity-55'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.active && !c.soft ? 'gradient-flame shadow-flame' : 'bg-fervor-ink-3 border border-fervor-border'}`}>
                  <c.icon className={`h-6 w-6 ${c.active && !c.soft ? 'text-white' : 'text-fervor-smoke'}`} />
                </div>
                {c.stat && <div className="text-right"><div className="font-display text-2xl font-bold text-fervor-flame leading-none">{c.stat}</div><div className="text-[10px] text-fervor-smoke font-mono uppercase">{c.statLabel}</div></div>}
                {!c.active && <Lock className="h-4 w-4 text-fervor-smoke/60" />}
              </div>
              <div className="font-display text-lg font-bold text-fervor-paper mb-1">{c.title}</div>
              <div className="text-sm text-fervor-smoke flex-1">{c.desc}</div>
              {c.active && <div className="flex items-center gap-1.5 text-fervor-flame text-xs font-mono uppercase tracking-wider mt-3">Abrir <ArrowRight className="h-3.5 w-3.5" /></div>}
              {!c.active && <div className="text-[10px] text-fervor-smoke/60 font-mono uppercase tracking-wider mt-3">Fase 2 · próximamente</div>}
            </div>
          );
          return c.active ? <Link key={c.title} href={c.href}>{inner}</Link> : <div key={c.title}>{inner}</div>;
        })}
      </div>
    </PageShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-fervor-ink-2 border border-fervor-border rounded-xl p-4">
      <div className="font-display text-3xl font-bold text-fervor-paper leading-none">{n}</div>
      <div className="text-[11px] text-fervor-smoke font-mono uppercase tracking-wider mt-1.5">{label}</div>
    </div>
  );
}
