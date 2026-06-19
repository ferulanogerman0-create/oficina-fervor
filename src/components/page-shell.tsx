import { Sidebar } from './sidebar';
import { BugReport } from './bug-report';
import { LogOut } from 'lucide-react';

export function PageShell({
  kicker, title, actions, children,
}: {
  kicker?: string; title: string; actions?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-fervor-ink grid-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-fervor-border flex items-center justify-between">
          <div>
            {kicker && <div className="kicker mb-1">{kicker}</div>}
            <h1 className="font-display text-3xl font-bold text-fervor-paper">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn-secondary text-sm flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Salir
              </button>
            </form>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
      <BugReport app="oficina" endpoint="/api/bugs" usuario="Germán" />
    </div>
  );
}
