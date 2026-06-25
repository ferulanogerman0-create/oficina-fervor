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
    if (await c.count()) { await c.first().click().catch(()=>{}); await page.waitForTimeout(250); } else break; }
}
async function expand(name) { const amp = page.getByText('Ampliar filtro de ' + name, { exact: false });
  if (await amp.count()) { await amp.first().scrollIntoViewIfNeeded().catch(()=>{}); await amp.first().click(); await page.waitForTimeout(1000); } }
async function incluir(label) {
  const row = page.locator('li, [role="option"]').filter({ hasText: new RegExp('^\\s*' + esc(label) + '\\s+Incluir\\b') }).first();
  if (await row.count()) { await row.getByText('Incluir', { exact: true }).first().click(); await page.waitForTimeout(500); return true; }
  return false;
}
await collapseAll(); await expand('Nivel de responsabilidad');
log('Nivel Propietario/socio:', await incluir('Propietario/socio'));
await collapseAll(); await expand('Empleados en la empresa');
for (const rng of ['Autónomo','1-10','11-50','51-200']) {
  const li = page.locator('li').filter({ hasText: new RegExp('^\\s*' + esc(rng) + '(?:\\s|$)') }).first();
  if (await li.count()) { await li.click(); await page.waitForTimeout(450); log('Empleados', rng, 'ok'); }
  else log('Empleados', rng, 'NOT FOUND');
}
await collapseAll(); await page.waitForTimeout(2800);
await page.screenshot({ path: 'sn_b2b.png' });
const count = await page.evaluate(() => { const m = document.body.innerText.match(/([\d.,]+\+?)\s*resultado/i); return m ? m[0] : '??'; });
log('RESULTS:', count);
process.exit(0);
