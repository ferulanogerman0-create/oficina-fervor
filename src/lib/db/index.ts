import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const url = process.env.DATABASE_URL || 'postgres://oficina:oficina@localhost:5432/oficina';
const client = postgres(url, { max: 10 });
export const db = drizzle(client, { schema });
export { schema };
