import { PageShell } from '@/components/page-shell';
import { listClientes } from '@/lib/actions/clientes';
import { listMetaAccounts, upsertMetaAccount, syncClienteAll } from '@/lib/actions/meta-accounts';
import { Check, X, RefreshCw, Plug, Flame } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ago = (d: Date | null) => {
  if (!d) return null;
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'hace instantes';
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
};

export default async function ConfigPage() {
  const [clientes, accounts] = await Promise.all([listClientes(), listMetaAccounts()]);
  const byClient = new Map(accounts.map((a) => [a.clientId, a]));
  const env = {
    metaAppId: !!process.env.META_APP_ID,
    metaSecret: !!process.env.META_APP_SECRET,
    api: process.env.META_API_VERSION || 'v21.0',
    db: !!process.env.DATABASE_URL,
    cron: !!process.env.CRON_SECRET,
  };

  return (
    <PageShell kicker="Setup" title="Configuración">
      {/* entorno */}
      <div className="card mb-6">
        <div className="kicker mb-2">Entorno</div>
        <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Variables</h2>
        <ul className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm font-mono">
          <EnvRow k="META_APP_ID" ok={env.metaAppId} />
          <EnvRow k="META_APP_SECRET" ok={env.metaSecret} />
          <EnvRow k="META_API_VERSION" val={env.api} ok />
          <EnvRow k="DATABASE_URL" ok={env.db} />
          <EnvRow k="CRON_SECRET" ok={env.cron} />
        </ul>
        <div className="mt-4 text-xs text-fervor-smoke">Setealas en EasyPanel → oficina-app → Entorno. Cron diario: <code className="text-fervor-flame">GET /api/cron/snapshot</code> (Authorization: Bearer CRON_SECRET).</div>
      </div>

      {/* meta por cliente */}
      <div className="kicker mb-2">Conexión Meta por cliente</div>
      <h2 className="font-display text-lg font-bold text-fervor-paper mb-4">Cuentas</h2>
      {clientes.length === 0 && <div className="card text-sm text-fervor-smoke">Cargá clientes primero.</div>}
      <div className="space-y-4">
        {clientes.map((c) => {
          const a = byClient.get(c.id);
          const connected = !!a?.fbPageAccessToken;
          return (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: c.color || '#FF5A1F' }}>
                    {c.esPropio ? <Flame className="h-4 w-4" /> : c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-bold text-fervor-paper flex items-center gap-2">
                      {c.nombre}
                      {c.esPropio && <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-fervor-flame/15 text-fervor-flame">Mi cuenta</span>}
                    </div>
                    <div className="text-[11px] font-mono flex items-center gap-1.5">
                      {connected
                        ? <span className="text-ok flex items-center gap-1"><Check className="h-3 w-3" />Conectada{a?.lastSyncedAt ? ` · sync ${ago(a.lastSyncedAt)}` : ''}</span>
                        : <span className="text-fervor-smoke flex items-center gap-1"><X className="h-3 w-3" />Sin conectar</span>}
                    </div>
                  </div>
                </div>
                {connected && (
                  <form action={async () => { 'use server'; await syncClienteAll(c.id); }}>
                    <button type="submit" className="btn-secondary text-xs flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Sincronizar</button>
                  </form>
                )}
              </div>

              <form action={upsertMetaAccount} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="hidden" name="client_id" value={c.id} />
                <Field label="Facebook Page ID" name="fb_page_id" defaultValue={a?.fbPageId ?? ''} placeholder="1234567890" />
                <Field label="IG Business ID" name="ig_business_id" defaultValue={a?.igBusinessId ?? ''} placeholder="17841400000000000" />
                <Field label="Ad Account ID" name="ad_account_id" defaultValue={a?.adAccountId ?? ''} placeholder="act_1234567890" />
                <Field label={`Page Access Token ${connected ? '(dejar vacío = mantener)' : ''}`} name="fb_page_access_token" type="password" placeholder={connected ? '••••••••' : 'EAAB...'} />
                <div className="md:col-span-2 flex items-center gap-2">
                  <button type="submit" className="btn-primary text-sm shadow-flame flex items-center gap-2"><Plug className="h-4 w-4" />Guardar conexión</button>
                </div>
              </form>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-fervor-smoke leading-relaxed max-w-3xl">
        <strong className="text-fervor-ash">Cómo conectar:</strong> creá una Meta App (developers.facebook.com, tipo Business) → App ID/Secret en env.
        Para cada cliente conseguí un <em>Page Access Token long-lived</em> con scopes <code className="text-fervor-flame">ads_read</code>, <code className="text-fervor-flame">instagram_basic</code>, <code className="text-fervor-flame">instagram_manage_insights</code>, <code className="text-fervor-flame">pages_read_engagement</code>.
        El token debe tener acceso al Ad Account vía Business Manager (Socios). Producción con cuentas de terceros requiere App Review.
      </div>
    </PageShell>
  );
}

function EnvRow({ k, ok, val }: { k: string; ok: boolean; val?: string }) {
  return (
    <li className="flex items-center justify-between bg-fervor-ink-3 px-3 py-2 rounded-lg text-xs">
      <span className="text-fervor-paper truncate">{k}</span>
      {val ? <span className="text-fervor-flame ml-2">{val}</span> :
        ok ? <Check className="h-3.5 w-3.5 text-ok flex-shrink-0" /> : <X className="h-3.5 w-3.5 text-alert flex-shrink-0" />}
    </li>
  );
}

function Field({ label, name, defaultValue, placeholder, type = 'text' }: { label: string; name: string; defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <label className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder}
             className="input-field w-full mt-1.5 normal-case font-sans tracking-normal text-sm" />
    </label>
  );
}
