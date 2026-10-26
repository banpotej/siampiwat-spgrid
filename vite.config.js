import { defineConfig } from 'vitest/config';

export default defineConfig({
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
