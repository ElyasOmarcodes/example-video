// node tools/capture.mjs --from 0 --to 10 --out renders/part.mp4 [--fps 30]
// Steps SIM.render(t) for every frame in headless Chromium and pipes JPEG screenshots into ffmpeg.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const MODS = process.env.HK_MODULES || new URL('../../claude-motion/node_modules', import.meta.url).pathname;
const {chromium} = await import(MODS + '/playwright/index.mjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const from = Number(arg('from', 0)), to = Number(arg('to', 5)), fps = Number(arg('fps', 30));
const out = path.resolve(arg('out', 'renders/test.mp4'));
const port = arg('port', process.env.PORT || '8771');
fs.mkdirSync(path.dirname(out), {recursive: true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?capture=1`);
await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 300000});
const err = await page.evaluate(() => window.SIM.error);
if (err) { console.error(err); process.exit(1); }
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), out], {stdio: ['pipe', 'inherit', 'inherit']});
const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
const t0 = Date.now();
for (let i = n0; i < n1; i++) {
  await page.evaluate((x) => window.SIM.render(x), i / fps);
  const buf = await page.screenshot({type: 'jpeg', quality: 94});
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if ((i - n0) % 120 === 0) console.log(`frame ${i - n0}/${n1 - n0}  ${((Date.now() - t0) / 1000 / Math.max(1, i - n0)).toFixed(3)} s/frame`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log('DONE', out, ((Date.now() - t0) / 1000).toFixed(0), 's');
