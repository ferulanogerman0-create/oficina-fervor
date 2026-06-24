import Link from 'next/link';
import {
  LayoutDashboard, Users, Megaphone, Film, Target,
  ListChecks, CalendarDays, BarChart3, Flame, Settings,
  Zap, Trophy, LifeBuoy, FileText, LayoutGrid, Send,
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tablero', label: 'Tablero Contenido', icon: LayoutGrid },
  { href: '/habitos', label: 'Hábitos', icon: Zap },
  { href: '/objetivos', label: 'Objetivos', icon: Trophy },
  { href: '/tareas', label: 'Tareas', icon: ListChecks },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/propuestas', label: 'Propuestas', icon: FileText },
  { href: '/ads', label: 'Meta Ads', icon: Megaphone },
  { href: '/videos', label: 'Video Analytics', icon: Film },
  { href: '/crm', label: 'CRM', icon: Target },
  { href: '/outreach', label: 'Outreach', icon: Send },
  { href: '/contenido', label: 'Contenido', icon: CalendarDays },
  { href: '/metricas', label: 'Métricas', icon: BarChart3 },
  { href: '/soporte', label: 'Soporte', icon: LifeBuoy },
  { href: '/config', label: 'Config', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-col bg-fervor-ink-2 border-r border-fervor-border flex-shrink-0">
      <div className="p-5 border-b border-fervor-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-flame flex items-center justify-center shadow-flame">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-bold text-fervor-paper text-lg">Oficina</div>
          <div className="text-xs text-fervor-smoke font-mono uppercase tracking-wider">FERVOR</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-fervor-ash/80
                       hover:bg-fervor-ink-3 hover:text-fervor-flame transition-colors"
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-fervor-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-fervor-flame/20 text-fervor-flame
                          flex items-center justify-center font-bold text-sm">G</div>
          <div className="leading-tight">
            <div className="text-sm text-fervor-paper font-medium">Germán</div>
            <div className="text-[10px] text-fervor-smoke font-mono uppercase tracking-wider">Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
