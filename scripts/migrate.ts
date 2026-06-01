import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL required'); process.exit(1); }

const client = postgres(url, { max: 1 });
const db = drizzle(client);

migrate(db, { migrationsFolder: './drizzle' })
  .then(() => { console.log('Migrations OK'); return client.end(); })
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
