// stills across every transition: node tools/trstill.mjs out_dir [p1 p2 ...]
import fs from 'node:fs';
import path from 'node:path';
const MODS = process.env.HK_MODULES || new URL('../../claude-motion/node_modules', import.meta.url).pathname;
const {chromium} = await import(MODS + '/playwright/index.mjs');
const [out, ...ps] = process.argv.slice(2);
const P = ps.length ? ps.map(Number) : [0.3, 0.6];
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1080, height: 1920}});
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto('http://127.0.0.1:8771/index.html?capture=1');
await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 120000});
const tr = await page.evaluate(() => window.SIM.film.tr.map((x) => ({a: x.a, b: x.b, type: x.type})));
let i = 0;
for (const x of tr) {
  for (const p of P) {
    const t = x.a + (x.b - x.a) * p;
    await page.evaluate((v) => window.SIM.render(v), t);
    await page.screenshot({path: path.join(out, `${String(i).padStart(2, '0')}_${x.type}_${p}.png`)});
  }
  i++;
}
await browser.close();
console.log(tr.map((x) => `${x.type}@${x.a.toFixed(1)}`).join(' '));
