import { chromium } from 'playwright-core';
const browser = await chromium.connectOverCDP('http://localhost:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
let page = ctx.pages().find(p => p.url().includes('linkedin.com/sales/search'));
if (!page) { console.log('NO SN PAGE'); process.exit(1); }
await page.bringToFront();
const esc = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const log = (...a) => console.log(...a);

async function collapseAll() {
  for (let i = 0; i < 12; i++) { const c = page.getByText('Contraer filtro de', { exact: false });
    if (await c.count()) { await c.first().click().catch(()=>{}); await page.waitForTimeout(260); } else break; }
}
async function expand(name) { const amp = page.getByText('Ampliar filtro de ' + name, { exact: false });
  if (await amp.count()) { await amp.first().scrollIntoViewIfNeeded().catch(()=>{}); await amp.first().click(); await page.waitForTimeout(1000); } }
async function incluir(label) {
  const row = page.locator('li, [role="option"]').filter({ hasText: new RegExp('^\\s*' + esc(label) + '\\s+Incluir\\b') }).first();
  if (await row.count()) { await row.getByText('Incluir', { exact: true }).first().click(); await page.waitForTimeout(520); return true; }
  return false;
}
async function typeIncluir(placeholder, name) {
  const combo = page.getByPlaceholder(placeholder);
  await combo.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
  await combo.pressSequentially(name, { delay: 70 }); await page.waitForTimeout(1650);
  return await incluir(name);
}

const borrar = page.getByText('Borrar todo', { exact: true });
if (await borrar.count()) { await borrar.first().click().catch(()=>{}); await page.waitForTimeout(1500); log('reset'); }

await collapseAll(); await expand('Industria');
for (const ind of ['Bienes inmuebles','Formación profesional y coaching','Gestión de inversiones','Asesoría de inversión','Servicios financieros','Agencias de seguros y corretaje','Consultoría y servicios a empresas','Servicios de marketing','Servicios de publicidad']) {
  log(`  Industria <- "${ind}": ${await typeIncluir('Añadir industrias', ind)}`);
}
await collapseAll(); await expand('Ubicación');
for (const geo of ['Argentina','México','Chile','Uruguay','Colombia','Perú','España']) {
  log(`  Ubicación <- "${geo}": ${await typeIncluir('Añadir ubicaciones', geo)}`);
}
await collapseAll(); await expand('Nivel de responsabilidad');
log(`  Nivel <- "Propietario/socio": ${await incluir('Propietario/socio')}`);
await collapseAll(); await expand('Empleados en la empresa');
for (const rng of ['Autónomo','1-10','11-50','51-200']) {
  const li = page.locator('li').filter({ hasText: new RegExp('^\\s*' + esc(rng) + '(?:\\s|$)') }).first();
  if (await li.count()) { await li.click(); await page.waitForTimeout(460); log(`  Empleados <- "${rng}": ok`); }
  else log(`  Empleados <- "${rng}": NOT FOUND`);
}

await collapseAll(); await page.waitForTimeout(3000);
await page.screenshot({ path: 'sn_b2b.png' });
const count = await page.evaluate(() => { const m = document.body.innerText.match(/([\d.,]+\+?)\s*resultado/i); return m ? m[0] : '??'; });
log('RESULTS:', count);
process.exit(0);
