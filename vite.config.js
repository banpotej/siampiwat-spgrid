import { defineConfig } from 'vitest/config';

/**
 * `dist/datagrid.js` stays a plain module (a page can load it by URL next to datagrid.css). The package's own entry
 * is `datagrid.styled.js`, which imports the stylesheet first, so a bundler pulls the CSS in with the JS.
 * @returns {import('vite').Plugin}
 */
const styledEntry = () => ({
  name: 'datagrid-styled-entry',
  generateBundle() {
    const emit = (/** @type {string} */ fileName, /** @type {string[]} */ lines) =>
      this.emitFile({ type: 'asset', fileName, source: `${lines.join('\n')}\n` });
    emit('datagrid.styled.js', ["import './datagrid.css';", "export * from './datagrid.js';"]);
    emit('datagrid.styled.cjs', [
      "require('./datagrid.css');",
      "module.exports = require('./datagrid.cjs');",
    ]);
  },
});

export default defineConfig({
  plugins: [styledEntry()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'DataGrid',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'datagrid.js' : 'datagrid.cjs'),
      cssFileName: 'datagrid',
    },
    sourcemap: true,
  },
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
