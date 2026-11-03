import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Needs `npm run build` first (npm run check does it before the e2e step).
test.skip(!existsSync('dist/datagrid.js'), 'dist/ is not built');

test('the built dist/datagrid.js and .css work on their own, loaded by URL', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/dist-import.html');
  await expect(page.getByRole('cell', { name: 'Ada' })).toBeVisible();
});

test('the package entry pulls the stylesheet in with the JS, while datagrid.js stays plain', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  expect(pkg.exports['.'].import).toBe('./dist/datagrid.styled.js');
  expect(pkg.exports['.'].require).toBe('./dist/datagrid.styled.cjs');
  const styled = readFileSync('dist/datagrid.styled.js', 'utf8');
  expect(styled.trim().split(/\r?\n/)).toEqual([
    "import './datagrid.css';",
    "export * from './datagrid.js';",
  ]);
  expect(readFileSync('dist/datagrid.styled.cjs', 'utf8')).toContain("require('./datagrid.css')");
  expect(readFileSync('dist/datagrid.js', 'utf8')).not.toContain('.css');
});

test('the install section documents npm, tarball URL, git URL, file and plain URL', async ({
  page,
}) => {
  await page.goto('/index.html');
  const install = page.getByRole('region', { name: 'การติดตั้ง' });
  for (const text of [
    'npm install @siampiwat/datagrid',
    'npm install https://github.com/banpotej/siampiwat-datagrid/releases/download/v1.0.1/siampiwat-datagrid-1.0.1.tgz',
    'npm install github:banpotej/siampiwat-datagrid',
    "import { DataGrid } from 'https://cdn.jsdelivr.net/npm/@siampiwat/datagrid@1.0.1/dist/datagrid.js'",
  ]) {
    await expect(install).toContainText(text);
  }
});
