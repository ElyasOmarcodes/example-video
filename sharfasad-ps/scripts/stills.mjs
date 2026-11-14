// node scripts/stills.mjs out/st 2 9.5 14 ...  → one PNG per second-mark + a tiled sheet
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const [dir, ...ts] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const comp = await selectComposition({serveUrl, id: process.env.COMP || 'Main', browserExecutable});
const files = [];
for (const t of ts) {
  const f = `${dir}/t${t}.png`;
  await renderStill({composition: comp, serveUrl, output: f, frame: Math.round(+t * 30), scale: 0.4, browserExecutable});
  files.push(f);
}
const cols = Math.min(6, files.length);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex',
  files.map((_, i) => `[${i}]drawtext=text='${ts[i]}':x=8:y=8:fontsize=22:fontcolor=red[v${i}]`).join(';') + ';' +
  files.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${files.length}:layout=` +
  files.map((_, i) => `${(i % cols) ? Array.from({length: i % cols}, () => 'w0').join('+') : 0}_${Math.floor(i / cols) ? Array.from({length: Math.floor(i / cols)}, () => 'h0').join('+') : 0}`).join('|') +
  (files.length % cols ? `:fill=black` : ''), `${dir}/sheet.png`]);
console.log(`${dir}/sheet.png`);
