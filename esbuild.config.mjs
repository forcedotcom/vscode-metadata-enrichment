import { build } from 'esbuild';

await build({
  bundle: true,
  entryPoints: ['./src/extension.ts'],
  external: ['vscode'],
  format: 'cjs',
  outdir: 'dist',
  platform: 'node',
  sourcemap: true,
  minify: false
});