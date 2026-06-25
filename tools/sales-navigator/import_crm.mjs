import { chromium } from 'playwright-core';
const browser = await chromium.connectOverCDP('http://localhost:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
let page = ctx.pages().find(p => p.url().includes('oficina.wolfdma.website/crm/importar')) || await ctx.newPage();
await page.goto('https://oficina.wolfdma.website/crm/importar', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.bringToFront();

const CSV = 'C:/Users/ARIDOS/Desktop/mi proyecto/pgscratch/li_extract/Connections.csv';
await page.setInputFiles('input[name="file"]', CSV);
await page.waitForTimeout(800);

await Promise.all([
  page.waitForLoadState('networkidle', { timeout: 40000 }).catch(()=>{}),
  page.getByRole('button', { name: /Importar al CRM/i }).click(),
]);
await page.waitForTimeout(3000);
await page.screenshot({ path: 'import_result.png' });
const res = await page.evaluate(() => {
  const t = document.body.innerText.replace(/\s+/g, ' ');
  const m = t.match(/(\d+)\s+contactos importados[^.]*\.?(\s*(\d+)\s+omitidos)?/i);
  return { url: location.href, msg: m ? m[0] : (t.match(/error|no es un connections|válido/i) ? t.slice(0, 200) : 'sin banner claro') };
});
console.log('IMPORT:', JSON.stringify(res, null, 1));
process.exit(0);
