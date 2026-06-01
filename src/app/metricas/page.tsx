import { PageShell } from '@/components/page-shell';
import { BarChart3 } from 'lucide-react';

export default function MetricasPage() {
  return (
    <PageShell kicker="Trends" title="Métricas">
      <div className="card text-center py-16">
        <BarChart3 className="h-10 w-10 text-fervor-flame/40 mx-auto mb-3" />
        <div className="text-fervor-paper font-medium mb-1">Gráficos de tendencia por cliente</div>
        <div className="text-fervor-smoke text-sm">Snapshot diario (cron) llena trend de followers / reach / leads / ad spend.</div>
      </div>
    </PageShell>
  );
}
