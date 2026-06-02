# Oficina FERVOR

Dashboard interno de FERVOR para gestionar la agencia y sus clientes (FMA, Victoria, etc).
Sustituye al Notion: visual, con gráficos, multi-módulo.

**Modelo:** la cuenta propia de FERVOR (`@wolfdmagency`) es un cliente más marcado `esPropio`
→ la "oficina central" muestra sus métricas, y cada cliente tiene su **mismo dashboard** scopeado.

Stack: Next.js 15 + Drizzle ORM + Postgres + Tailwind + Recharts.
Identidad: fuego/naranja `#FF5A1F`, Space Grotesk + Inter + JetBrains Mono.

## Módulos

- **Dashboard** — KPIs reales + trend + cartera (cuenta propia primero) + botón Sincronizar Meta
- **Clientes** — CRUD + **dashboard completo por cliente** (`/clientes/[id]`): KPIs, trend seguidores, pipeline CRM, top reels, ads, tareas, contenido. Editar en `/clientes/[id]/editar`
- **Meta Ads** (`/ads`) — KPIs + tabla de campañas + sync, filtro por cliente
- **Video Analytics** (`/videos`) — grid de reels ordenable (alcance/plays/eng/saves), filtro + sync
- **Métricas** (`/metricas`) — trend por cliente (followers/alcance/leads/gasto) ventana 7/30/90d
- **CRM** — pipeline 6 etapas, filtro por cliente
- **Tareas** — checklist por cliente/categoría/prioridad, filtro por cliente
- **Contenido** — board kanban (idea → producción → aprobado → posteado), filtro por cliente
- **Config** — estado env + **conexión Meta por cliente** (guarda en `meta_accounts`) + sync manual

## Datos (Meta Graph API)

`src/lib/meta/index.ts`: `syncPosts` (reels/posts IG + insights), `syncCampaigns` (Ads),
`snapshotClient` (account insights diarios). Tokens por cliente en tabla `meta_accounts` (form en `/config`).

Cron diario: `GET /api/cron/snapshot` (header `Authorization: Bearer <CRON_SECRET>` o `?secret=`).
Arma el snapshot del día por cliente (insights Meta + leads/spend locales) → tabla `metric_snapshots`.

## Dev local

Opción A — **Postgres portable embebido** (sin instalar nada, recomendado):

```bash
npm install
node scripts/devdb.mjs            # levanta postgres en :5432 (data en .pgdata), queda vivo
# en otra terminal:
npm run db:migrate
npm run db:seed                   # user german + clientes FERVOR/FMA/Victoria
npx tsx scripts/seed-demo.ts      # datos demo (reels/campañas/30d snapshots/leads/tareas/ideas)
npm run dev                       # puerto 3002
```

Opción B — Postgres propio: setear `DATABASE_URL` en `.env` y correr migrate/seed/dev.

Login: `german` / `changeme` (cambiar via `SEED_PASS`).

## Deploy EasyPanel (VPS)

1. Crear DB `oficina-db` (Postgres) en EasyPanel.
2. Crear app `oficina-app` apuntando al repo GitHub, build Dockerfile.
3. Env vars: `DATABASE_URL`, `META_APP_ID`, `META_APP_SECRET`, `META_API_VERSION`, `CRON_SECRET`, `SEED_USER`, `SEED_PASS`, `SEED_NOMBRE`, `SESSION_SECRET`.
4. Dominio sugerido: `oficina.wolfdma.website`.
5. El entrypoint corre migrations + seed automático al bootear. Registrar el cron diario apuntando a `/api/cron/snapshot`.

## Meta — conectar una cuenta

1. Meta App en https://developers.facebook.com (Type: Business) → `META_APP_ID` + `META_APP_SECRET`.
2. Por cliente: Page Access Token long-lived con scopes `ads_read`, `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`.
3. El token debe tener acceso al Ad Account vía Business Manager (Socios). Cuentas de terceros en prod → App Review.
4. Cargar Page ID / IG Business ID / Ad Account ID / Token en `/config`.

## Estructura

```
src/
├── app/
│   ├── page.tsx                  dashboard central (data real + sync-all)
│   ├── clientes/                 lista, [id] dashboard del cliente, [id]/editar, nuevo
│   ├── ads/ videos/ metricas/    módulos reales (filtro por cliente)
│   ├── crm/ tareas/ contenido/   pipeline / checklist / board (filtro por cliente)
│   ├── config/                   env + conexión Meta por cliente
│   ├── api/auth/                 login/logout
│   ├── api/cron/snapshot/        cron snapshot diario
│   └── login/
├── components/                   page-shell, sidebar, trend-chart, metric-trends
├── lib/
│   ├── db/                       Drizzle schema + client
│   ├── auth/                     sesión cookies
│   ├── meta/                     cliente Meta Graph API (sync posts/campaigns/snapshot)
│   ├── actions/                  ads, videos, metricas, dashboard, clientes, leads,
│   │                             tareas, contenido, meta-accounts
│   └── types.ts
└── middleware.ts                 redirect /login si no auth

scripts/migrate.ts · seed.ts · seed-demo.ts · devdb.mjs   drizzle/   Dockerfile
```
