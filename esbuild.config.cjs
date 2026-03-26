const { build } = require('esbuild');

build({
  bundle: true,
  entryPoints: ['./src/extension.ts'],
  external: ['vscode', '@salesforce/core', '@salesforce/source-deploy-retrieve', '@salesforce/metadata-enrichment'],
  format: 'cjs',
  outdir: 'dist',
  platform: 'node',
  sourcemap: true,
  minify: false,
  banner: { js: 'process.env.SF_DISABLE_LOG_FILE = "true";' }
}).catch(() => process.exit(1));
