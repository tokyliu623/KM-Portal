const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/server-bundle/index.js',
  format: 'esm',
  external: [],
  sourcemap: false,
  minify: false,
  banner: {
    js: 'import { createRequire as __createRequire } from "module";const require = __createRequire(import.meta.url);',
  },
}).then(() => {
  console.log('Server bundle created successfully!');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});