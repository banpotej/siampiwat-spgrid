import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Builds the example pages (landing page + demos) into `site/` for static hosting (Cloudflare Pages).
 * The library itself is built by `vite.config.js` into `dist/`; `npm run build:site` runs both.
 *
 * Two things must stay as plain files next to the bundled pages: `examples/*` (the source viewer fetches
 * `/examples/<file>` to show the code) and `dist/*` (the landing page offers it for download).
 * `dist/types` (the `.d.ts` files) is left out: nothing on the site uses it, and static-file uploaders
 * reject uploads that contain TypeScript files.
 * @returns {import('vite').Plugin}
 */
const copyRawFiles = () => ({
  name: 'spgrid-site-raw-files',
  closeBundle() {
    const skipTypes = resolve('dist', 'types');
    for (const dir of ['examples', 'dist']) {
      cpSync(resolve(dir), resolve('site', dir), {
        recursive: true,
        filter: (src) => resolve(src) !== skipTypes,
      });
    }
  },
});

export default defineConfig({
  plugins: [copyRawFiles()],
  build: {
    outDir: 'site',
    emptyOutDir: true,
    rollupOptions: {
      input: [
        'index.html',
        'quick-start.html',
        'for-agents.html',
        'upgrade.html',
        'changelog.html',
        'basic.html',
        'purchase-order.html',
        'theme-lavender.html',
        'worklist.html',
        'recent-receipts.html',
        'status-summary.html',
        'view-settings.html',
        'calendar.html',
      ].map((f) => resolve(f)),
    },
  },
});
