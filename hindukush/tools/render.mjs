// One render of the whole film with a per-scene cache.
//   node tools/render.mjs --cache renders/cache [--workers 3] [--fps 60] [--force all|T,S1,P05,...]
// 1. plans one segment per scene (cut where the scene's incoming transition ends — a still, settled frame);
// 2. fingerprints every segment from the exact visible state of EVERY frame (the rendered DOM with its
//    inline styles, images replaced by their file hashes) plus the hashes of style.css, fonts and timeline,
//    so an edited scene is found automatically and untouched scenes are reused from the cache;
// 3. renders only the segments that changed (several browsers in parallel on the one machine);
// 4. writes cache/manifest.json. tools/assemble.sh then joins the segments and encodes the film once.
import {spawn} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const MODS = process.env.HK_MODULES || new URL('../../claude-motion/node_modules', import.meta.url).pathname;
const {chromium} = await import(MODS + '/playwright/index.mjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const CACHE = path.resolve(arg('cache', 'renders/cache'));
const W = Number(arg('workers', 3)), FPS = Number(arg('fps', 60)), PORT = arg('port', process.env.PORT || '8771');
const force = arg('force', '');
fs.mkdirSync(CACHE, {recursive: true});

async function openPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html?capture=1`);
  await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 300000});
  const err = await page.evaluate(() => window.SIM.error);
  if (err) throw new Error(err);
  return {browser, page};
}
const frame = async (page, i, q = 94) => {
  await page.evaluate((x) => window.SIM.render(x), i / FPS);
  return page.screenshot({type: 'jpeg', quality: q});
};
async function pool(items, n, fn) {
  const q = items.slice();
  await Promise.all(Array.from({length: Math.min(n, q.length)}, async (_, w) => { while (q.length) await fn(q.shift(), w); }));
}

const t0 = Date.now();
const ws = [];
for (let i = 0; i < W; i++) ws.push(await openPage());
const segs = await ws[0].page.evaluate((f) => window.SIM.segments(f), FPS);
const total = segs[segs.length - 1].f1;
console.log(`plan: ${segs.length} segments, ${total} frames at ${FPS} fps`);
// fingerprints: global inputs + per-frame visible DOM state
const WEB = path.resolve(new URL('../web', import.meta.url).pathname);
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const AH = {};
for (const f of walk(path.join(WEB, 'assets'))) AH['assets/' + path.relative(path.join(WEB, 'assets'), f)] = sha(fs.readFileSync(f));
const GLOBAL = sha(fs.readFileSync(path.join(WEB, 'style.css')) + Object.entries(AH).filter(([k]) => /fonts|timeline/.test(k)).map((x) => x.join(':')).join());
for (const {page} of ws) await page.evaluate((ah) => {
  const ser = (el) => {
    if (el.nodeType === 3) return el.nodeValue;
    if (el.nodeType !== 1 || el.style?.display === 'none') return '';
    let a = '';
    for (const at of el.attributes) {
      if (at.name === 'style') { const c = el.style.cssText; if (c) a += ` style="${c}"`; continue; }
      a += ` ${at.name}="${at.name === 'src' ? ah[at.value] || at.value : at.value}"`;
    }
    let c = '';
    for (const ch of el.childNodes) c += ser(ch);
    return `<${el.tagName}${a}>${c}</${el.tagName}>`;
  };
  window.__sig = (t) => { window.SIM.render(t); return ser(document.getElementById('app')); };
}, AH);
await pool(segs, W, async (s, w) => {
  const h = crypto.createHash('sha1').update(GLOBAL);
  const dump = process.env.HK_DUMP ? [] : null;
  for (let f = s.f0; f < s.f1; f++) {
    const sg = await ws[w].page.evaluate((t) => window.__sig(t), f / FPS);
    h.update(sg);
    if (dump) dump.push(sg);
  }
  s.fp = h.digest('hex').slice(0, 16);
  if (dump) fs.writeFileSync(path.join(process.env.HK_DUMP, `${s.id}.json`), JSON.stringify(dump));
});
if (arg('dry', null)) { console.log(segs.map((s) => `${s.id}:${s.fp}`).join(' ')); process.exit(0); }
const manPath = path.join(CACHE, 'manifest.json');
const old = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {fps: 0, segments: []};
const forced = new Set(force.split(',').filter(Boolean));
for (const s of segs) {
  const o = old.fps === FPS ? old.segments.find((x) => x.id === s.id) : null;
  s.file = `seg_${String(s.i).padStart(2, '0')}_${s.id}.mp4`;
  const have = o && o.f0 === s.f0 && o.f1 === s.f1 && o.fp === s.fp && fs.existsSync(path.join(CACHE, o.file));
  s.need = forced.has('all') || forced.has(s.id) || !have;
  if (!s.need && o.file !== s.file) fs.renameSync(path.join(CACHE, o.file), path.join(CACHE, s.file));
}
const need = segs.filter((s) => s.need);
console.log(`fingerprints done in ${((Date.now() - t0) / 1000).toFixed(0)} s; to render: ${need.map((s) => s.id).join(' ') || 'nothing'}`);
// render the changed segments, longest first
need.sort((a, b) => (b.f1 - b.f0) - (a.f1 - a.f0));
let done = 0;
await pool(need, W, async (s, w) => {
  const out = path.join(CACHE, s.file + '.part');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '11', '-g', String(FPS * 2), '-pix_fmt', 'yuv420p', '-r', String(FPS), '-f', 'mp4', out], {stdio: ['pipe', 'inherit', 'inherit']});
  for (let f = s.f0; f < s.f1; f++) {
    const buf = await frame(ws[w].page, f);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 600 === 0) console.log(`  ${done} frames  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  fs.renameSync(out, path.join(CACHE, s.file));
  console.log(`  ✓ ${s.id} (${s.f1 - s.f0} frames)`);
});
for (const {browser} of ws) await browser.close();
fs.writeFileSync(manPath, JSON.stringify({fps: FPS, frames: total, segments: segs.map(({i, id, f0, f1, fp, file}) => ({i, id, f0, f1, fp, file}))}, null, 1));
fs.writeFileSync(path.join(CACHE, 'rendered.txt'), need.map((s) => s.file).join('\n') + '\n');
console.log(`DONE in ${((Date.now() - t0) / 1000).toFixed(0)} s — rendered ${need.length}/${segs.length} segments`);
