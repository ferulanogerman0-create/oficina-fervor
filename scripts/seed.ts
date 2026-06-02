import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from '../src/lib/db/schema';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL required'); process.exit(1); }
const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  const username = process.env.SEED_USER || 'german';
  const password = process.env.SEED_PASS || 'changeme';
  const nombre = process.env.SEED_NOMBRE || 'Germán Ferulano';

  const [existsUser] = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  if (!existsUser) {
    await db.insert(schema.users).values({
      username, nombre,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'owner',
    });
    console.log('✓ Usuario', username, 'creado');
  } else console.log('· Usuario', username, 'ya existe');

  const seedClients = [
    { slug: 'fervor', nombre: 'FERVOR', rubro: 'Agencia (cuenta propia)', color: '#FF5A1F',
      igHandle: '@wolfdmagency', estado: 'activo', prioridad: 'alta', esPropio: true },
    { slug: 'fma', nombre: 'FMA Mecatrónica', rubro: 'Taller', color: '#00B4D8',
      igHandle: '@fma_mecatronica', whatsapp: '+5493489681980', estado: 'activo', prioridad: 'alta' },
    { slug: 'victoria', nombre: 'Victoria Carbone', rubro: 'Psicología', color: '#A08880',
      igHandle: '@victoriacarbone.psi', whatsapp: '+5493489324935', estado: 'activo', prioridad: 'media' },
  ];
  for (const c of seedClients) {
    const [exists] = await db.select().from(schema.clients).where(eq(schema.clients.slug, c.slug)).limit(1);
    if (!exists) {
      await db.insert(schema.clients).values(c as typeof schema.clients.$inferInsert);
      console.log('✓ Cliente', c.slug, 'creado');
    } else console.log('· Cliente', c.slug, 'ya existe');
  }
  await client.end();
  console.log('Seed listo.');
}
main().catch((e) => { console.error(e); process.exit(1); });
