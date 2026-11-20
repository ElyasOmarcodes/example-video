// bundles web/src/main.js → web/bundle.js (three from claude-motion's node_modules)
import * as esbuild from '/home/user/example-video/claude-motion/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'web/src/main.js')], bundle: true, format: 'esm', target: 'es2022', minify: false,
  outfile: path.join(ROOT, 'web/bundle.js'), nodePaths: ['/home/user/example-video/claude-motion/node_modules'], logLevel: 'warning', sourcemap: false,
});
console.log('built');
