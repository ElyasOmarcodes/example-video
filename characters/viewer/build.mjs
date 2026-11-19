import * as esbuild from '/home/user/example-video/claude-motion/node_modules/esbuild/lib/main.js';
await esbuild.build({entryPoints: ['main.js'], bundle: true, format: 'esm', outfile: 'bundle.js', nodePaths: ['/home/user/example-video/claude-motion/node_modules'], logLevel: 'warning'});
console.log('bundled');
