import { Flame } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await getSessionUser();
  if (me) redirect('/');
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-fervor-ink grid-bg p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-xl gradient-flame flex items-center justify-center shadow-flame">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <div className="font-display font-bold text-fervor-paper text-2xl leading-none">Oficina</div>
            <div className="text-xs text-fervor-smoke font-mono uppercase tracking-widest mt-1">FERVOR</div>
          </div>
        </div>

        <form action="/api/auth/login" method="POST" className="card space-y-4">
          {error && (
            <div className="text-sm text-alert bg-alert/10 border border-alert/30 rounded-lg px-3 py-2">
              {error === 'bad_creds' ? 'Usuario o contraseña incorrectos' : 'Error: ' + error}
            </div>
          )}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">Usuario</label>
            <input name="username" type="text" required autoComplete="username"
              className="input-field w-full" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-fervor-smoke mb-1.5">Contraseña</label>
            <input name="password" type="password" required autoComplete="current-password"
              className="input-field w-full" />
          </div>
          <button type="submit" className="btn-primary w-full shadow-flame">Encender</button>
        </form>
      </div>
    </main>
  );
}
