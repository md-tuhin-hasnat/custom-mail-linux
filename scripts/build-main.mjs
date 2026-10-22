import * as esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

const distDir = path.resolve('dist/main');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

await esbuild.build({
  entryPoints: ['src/main/main.ts', 'src/main/preload.ts'],
  outdir: 'dist/main',
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],
  format: 'cjs',
  sourcemap: true,
});

console.log('Electron main & preload bundled successfully.');
