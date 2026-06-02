// DB local portable (sin admin) para validar la Oficina en dev.
// Arranca embedded-postgres en :5432, crea la DB, y queda vivo.
import EmbeddedPostgres from 'embedded-postgres';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'oficina',
  password: 'oficina',
  port: 5432,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

async function main() {
  const fs = await import('fs');
  const fresh = !fs.existsSync(dataDir);
  if (fresh) {
    console.log('init cluster...');
    await pg.initialise();
  }
  await pg.start();
  console.log('postgres up on :5432');
  try {
    await pg.createDatabase('oficina');
    console.log('db oficina creada');
  } catch (e) {
    console.log('db oficina ya existe (ok)');
  }
  console.log('READY');
  // mantener vivo
  process.stdin.resume();
  const stop = async () => { try { await pg.stop(); } catch {} process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
main().catch((e) => { console.error('devdb error:', e); process.exit(1); });
