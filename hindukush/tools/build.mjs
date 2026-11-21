// bundles web/src/main.js → web/bundle.js
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODS = process.env.HK_MODULES || path.resolve(ROOT, '../claude-motion/node_modules');
const esbuild = await import(MODS + '/esbuild/lib/main.js');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'web/src/main.js')], bundle: true, format: 'esm', target: 'es2022', minify: false,
  outfile: path.join(ROOT, 'web/bundle.js'), nodePaths: [MODS], logLevel: 'warning', sourcemap: false,
});
console.log('built');
