import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Builds the example pages (landing page + demos) into `site/` for static hosting (Cloudflare Pages).
 * The library itself is built by `vite.config.js` into `dist/`; `npm run build:site` runs both.
 *
 * Two things must stay as plain files next to the bundled pages: `examples/*` (the source viewer fetches
 * `/examples/<file>` to show the code) and `dist/*` (the landing page offers it for download).
 * @returns {import('vite').Plugin}
 */
const copyRawFiles = () => ({
  name: 'spgrid-site-raw-files',
  closeBundle() {
    for (const dir of ['examples', 'dist']) {
      cpSync(resolve(dir), resolve('site', dir), { recursive: true });
    }
  },
});

export default defineConfig({
  plugins: [copyRawFiles()],
  build: {
    outDir: 'site',
    emptyOutDir: true,
    rollupOptions: {
      input: ['index.html', 'quick-start.html', 'basic.html', 'purchase-order.html'].map((f) =>
        resolve(f),
      ),
    },
  },
});
