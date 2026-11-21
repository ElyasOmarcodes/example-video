// node tools/still.mjs out_dir t1 t2 ...   → PNG stills of SIM.render(t) (server on :8771)
import fs from 'node:fs';
import path from 'node:path';
const MODS = process.env.HK_MODULES || new URL('../../claude-motion/node_modules', import.meta.url).pathname;
const {chromium} = await import(MODS + '/playwright/index.mjs');
const [out, ...ts] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
await page.goto('http://127.0.0.1:8771/index.html?capture=1');
await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 120000});
const err = await page.evaluate(() => window.SIM.error);
if (err) { console.error(err); process.exit(1); }
for (const t of ts) {
  await page.evaluate((x) => window.SIM.render(x), Number(t));
  await page.screenshot({path: path.join(out, `t${Number(t).toFixed(2).padStart(7, '0')}.png`)});
}
await browser.close();
console.log('ok', ts.length);
