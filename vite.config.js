import { defineConfig } from 'vitest/config';

/**
 * `dist/spgrid.js` stays a plain module (a page can load it by URL next to spgrid.css). The package's own entry
 * is `spgrid.styled.js`, which imports the stylesheet first, so a bundler pulls the CSS in with the JS.
 * @returns {import('vite').Plugin}
 */
const styledEntry = () => ({
  name: 'spgrid-styled-entry',
  generateBundle() {
    const emit = (/** @type {string} */ fileName, /** @type {string[]} */ lines) =>
      this.emitFile({ type: 'asset', fileName, source: `${lines.join('\n')}\n` });
    emit('spgrid.styled.js', ["import './spgrid.css';", "export * from './spgrid.js';"]);
    emit('spgrid.styled.cjs', [
      "require('./spgrid.css');",
      "module.exports = require('./spgrid.cjs');",
    ]);
  },
});

export default defineConfig({
  plugins: [styledEntry()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'SPGrid',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'spgrid.js' : 'spgrid.cjs'),
      cssFileName: 'spgrid',
    },
    sourcemap: true,
  },
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
