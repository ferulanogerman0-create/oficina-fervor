import { PageShell } from '@/components/page-shell';
import { Megaphone } from 'lucide-react';

export default function AdsPage() {
  return (
    <PageShell kicker="Meta Ads" title="Campañas">
      <div className="card text-center py-16">
        <Megaphone className="h-10 w-10 text-fervor-flame/40 mx-auto mb-3" />
        <div className="text-fervor-paper font-medium mb-1">Conectá Meta para ver tus campañas</div>
        <div className="text-fervor-smoke text-sm mb-5">Necesita Meta App + token de cada cliente. Configurable en /config.</div>
        <a href="/config" className="btn-primary text-sm shadow-flame">Configurar Meta</a>
      </div>
    </PageShell>
  );
}
