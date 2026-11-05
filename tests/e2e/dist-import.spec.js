import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Needs `npm run build` first (npm run check does it before the e2e step).
test.skip(!existsSync('dist/spgrid.js'), 'dist/ is not built');

test('the built dist/spgrid.js and .css work on their own, loaded by URL', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/dist-import.html');
  await expect(page.getByRole('cell', { name: 'Ada' })).toBeVisible();
});

test('the package entry pulls the stylesheet in with the JS, while spgrid.js stays plain', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  expect(pkg.exports['.'].import).toBe('./dist/spgrid.styled.js');
  expect(pkg.exports['.'].require).toBe('./dist/spgrid.styled.cjs');
  const styled = readFileSync('dist/spgrid.styled.js', 'utf8');
  expect(styled.trim().split(/\r?\n/)).toEqual([
    "import './spgrid.css';",
    "export * from './spgrid.js';",
  ]);
  expect(readFileSync('dist/spgrid.styled.cjs', 'utf8')).toContain("require('./spgrid.css')");
  expect(readFileSync('dist/spgrid.js', 'utf8')).not.toContain('.css');
});

test('the install section documents npm, tarball URL, git URL, file and plain URL', async ({
  page,
}) => {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  // The page swaps in the latest version on npm, which is older than package.json until a release is published.
  await page.route('https://registry.npmjs.org/**', (route) => route.abort());
  await page.goto('/index.html');
  const install = page.getByRole('region', { name: 'การติดตั้ง' });
  for (const text of [
    'npm install @siampiwat/spgrid',
    `npm install https://github.com/banpotej/siampiwat-datagrid/releases/download/v${version}/siampiwat-spgrid-${version}.tgz`,
    'npm install github:banpotej/siampiwat-datagrid',
    `import { SPGrid } from 'https://cdn.jsdelivr.net/npm/@siampiwat/spgrid@${version}/dist/spgrid.js'`,
  ]) {
    await expect(install).toContainText(text);
  }
});
