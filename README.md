# Oficina FERVOR

Dashboard interno de FERVOR para gestionar clientes (FMA, Victoria, etc).
Sustituye al Notion: visual, con gráficos, multi-módulo.

Stack: Next.js 15 + Drizzle ORM + Postgres + Tailwind + Recharts.
Identidad: fuego/naranja `#FF5A1F`, Space Grotesk + Inter + JetBrains Mono.

## Módulos

- **Dashboard** — KPIs + trend chart + cartera
- **Clientes** — CRUD multi-cliente
- **Meta Ads** — campañas Meta (pendiente: conectar Graph API)
- **Video Analytics** — top reels IG/FB (pendiente)
- **CRM** — pipeline 6-etapas (nuevo → cerrado)
- **Tareas** — checklist diario por cliente
- **Contenido** — content board kanban (idea → producción → aprobado → posteado)
- **Métricas** — trends diarios (pendiente cron)
- **Config** — env vars + Meta tokens por cliente

## Dev local

```bash
npm install
# Postgres requerido (DATABASE_URL en .env)
npm run db:generate        # ya generado en /drizzle
npm run db:migrate
npm run db:seed            # crea user german + clientes FMA + Victoria
npm run dev                # puerto 3002
```

Login: `german` / `changeme` (cambiar via `SEED_PASS`).

## Deploy EasyPanel (VPS)

1. Crear DB `oficina-db` (Postgres 17) en EasyPanel.
2. Crear app `oficina-app` apuntando al repo GitHub, branch `master`, build Dockerfile.
3. Env vars: `DATABASE_URL`, `META_APP_ID`, `META_APP_SECRET`, `SEED_USER`, `SEED_PASS`, `SEED_NOMBRE`, `SESSION_SECRET`.
4. Dominio sugerido: `oficina.wolfdma.website`.
5. El entrypoint corre migrations + seed automático al bootear.

## Meta Graph API (próximo)

Crear app en https://developers.facebook.com (Type: Business). Obtener App ID + Secret.
Para cada cliente: Page ID + IG Business ID + Ad Account ID + Page Access Token (long-lived).
Configurar en `/config`.

## Estructura

```
src/
├── app/                          páginas Next App Router
│   ├── (root)/page.tsx           dashboard
│   ├── clientes/                 CRUD clientes
│   ├── crm/                      pipeline leads
│   ├── tareas/                   checklist
│   ├── contenido/                content board kanban
│   ├── ads/ videos/ metricas/    stubs (módulos pendientes)
│   ├── config/                   env + tokens Meta
│   └── login/ api/auth/          auth
├── components/                   shell, sidebar, charts
├── lib/
│   ├── db/                       Drizzle schema + client
│   ├── auth/                     sesión cookies
│   ├── actions/                  server actions por dominio
│   ├── meta/                     (pendiente) cliente Graph API
│   └── types.ts                  enums compartidos
└── middleware.ts                 redirect /login si no auth

scripts/migrate.ts  scripts/seed.ts  drizzle/...  Dockerfile  docker-entrypoint.sh
```
