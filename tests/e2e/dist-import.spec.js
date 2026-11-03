import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Needs `npm run build` first (npm run check does it before the e2e step).
test.skip(!existsSync('dist/datagrid.js'), 'dist/ is not built');

test('the built dist/datagrid.js and .css work on their own, loaded by URL', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/dist-import.html');
  await expect(page.getByRole('cell', { name: 'Ada' })).toBeVisible();
});

test('the install section documents npm, tarball URL, git URL, file and plain URL', async ({
  page,
}) => {
  await page.goto('/index.html');
  const install = page.getByRole('region', { name: 'การติดตั้ง' });
  for (const text of [
    'npm install datagrid',
    'npm install https://your-host/datagrid-0.0.0.tgz',
    'npm install github:banpotej/datagrid',
    "import { DataGrid } from 'https://your-host/datagrid.js'",
  ]) {
    await expect(install).toContainText(text);
  }
});
