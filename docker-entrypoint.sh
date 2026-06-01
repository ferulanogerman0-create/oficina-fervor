#!/bin/sh
set -e
echo "→ Migrations…"
npx tsx scripts/migrate.ts || { echo "migrations failed"; exit 1; }
echo "→ Seed admin…"
npx tsx scripts/seed.ts || echo "seed skipped"
echo "→ Starting Next.js…"
exec node server.js
