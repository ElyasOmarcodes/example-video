// node tools/still.mjs out.png t1 [t2 ...]  → renders stills (tiled if several) from the running server
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const MODS = process.env.NAHZAT_MODULES || new URL('../../claude-motion/node_modules', import.meta.url).pathname;
const {chromium} = await import(MODS + '/playwright/index.mjs');
const [out, ...ts] = process.argv.slice(2);
const browser = await chromium.launch({args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.error('[page]', m.text().slice(0, 300)));
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
const t0 = Date.now();
await page.goto('http://127.0.0.1:8770/index.html?capture=1');
await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 300000});
const err = await page.evaluate(() => window.SIM.error);
if (err) { console.error(err); process.exit(1); }
console.error('boot', ((Date.now() - t0) / 1000).toFixed(1), 's');
const files = [];
for (const t of ts) {
  const s = Date.now();
  await page.evaluate((x) => window.SIM.render(x), Number(t));
  const f = ts.length > 1 ? out.replace(/\.(png|jpg)$/, `_${t}.$1`) : out;
  await page.screenshot({path: f, type: f.endsWith('.jpg') ? 'jpeg' : 'png', quality: f.endsWith('.jpg') ? 90 : undefined});
  console.error('t', t, ((Date.now() - s) / 1000).toFixed(2), 's');
  files.push(f);
}
await browser.close();
console.log(files.join('\n'));
