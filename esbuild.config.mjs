import { build } from 'esbuild';

await build({
  bundle: true,
  entryPoints: ['./out/src/extension.js'],
  external: ['vscode', '@salesforce/core', '@salesforce/source-deploy-retrieve', '@salesforce/metadata-enrichment'],
  format: 'cjs',
  outfile: 'dist/index.js',
  platform: 'node',
  sourcemap: true,
  minify: true,
  banner: { js: 'process.env.SF_DISABLE_LOG_FILE = "true";' }
}).catch(() => process.exit(1));
