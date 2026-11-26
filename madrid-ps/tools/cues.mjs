// dumps the sound cue registry + transition windows → data/cues.json
import fs from 'node:fs';
const MODS = process.env.MD_MODULES || new URL('../../claude-motion/node_modules', import.meta.url).pathname;
const {chromium} = await import(MODS + '/playwright/index.mjs');
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1080, height: 1920}});
await page.goto(`http://127.0.0.1:${process.env.PORT || 8772}/index.html?capture=1`);
await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 120000});
const j = await page.evaluate(() => window.SIM.cues());
fs.writeFileSync(new URL('../data/cues.json', import.meta.url), JSON.stringify(j));
await browser.close();
console.log('cues', j.cues.length, 'duration', j.duration);
