import { PageShell } from '@/components/page-shell';
import { Film } from 'lucide-react';

export default function VideosPage() {
  return (
    <PageShell kicker="Reels / IG" title="Video Analytics">
      <div className="card text-center py-16">
        <Film className="h-10 w-10 text-fervor-flame/40 mx-auto mb-3" />
        <div className="text-fervor-paper font-medium mb-1">Top reels y posts por performance</div>
        <div className="text-fervor-smoke text-sm mb-5">Conectá IG Business para traer reach, plays, saves, shares.</div>
        <a href="/config" className="btn-primary text-sm shadow-flame">Conectar IG</a>
      </div>
    </PageShell>
  );
}
