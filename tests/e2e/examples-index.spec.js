import { expect, test } from '@playwright/test';

test('landing page lists each example as a card', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DataGrid');
  const cards = page.locator('#examples');
  await expect(cards.getByRole('link')).toHaveCount(2);
  await cards.getByRole('link', { name: /Goods Receipt/ }).click();
  await expect(page).toHaveURL(/\/goods-receipt\.html$/);
});

test('the nav is on every example page, marks the current one, and leads home', async ({
  page,
}) => {
  await page.goto('/purchase-order.html');
  const nav = page.getByRole('navigation', { name: 'เมนูตัวอย่าง' });
  await expect(nav.getByRole('link', { name: 'Purchase Order' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await nav.getByRole('link', { name: 'Goods Receipt' }).click();
  await expect(page).toHaveURL(/\/goods-receipt\.html$/);
  await expect(nav.getByRole('link', { name: 'Goods Receipt' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await nav.getByRole('link', { name: 'DataGrid' }).click();
  await expect(page).toHaveURL(/localhost:5173\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DataGrid');
});

test('landing page explains how to install the package', async ({ page }) => {
  await page.goto('/index.html');
  const install = page.getByRole('region', { name: 'การติดตั้ง' });
  await expect(install.locator('code').first()).toHaveText('npm install datagrid');
  await expect(install).toContainText("import 'datagrid/style.css'");
  await expect(install).toContainText('npm pack');
});

test('the install section offers the packed tarball for download when it exists', async ({
  page,
}) => {
  await page.route('**/datagrid-*.tgz', (route) =>
    route.fulfill({ status: 200, contentType: 'application/gzip', body: 'x' }),
  );
  await page.goto('/index.html');
  const link = page.getByRole('link', { name: /ดาวน์โหลด datagrid-.*\.tgz/ });
  await expect(link).toHaveAttribute('href', /^\/datagrid-\d+\.\d+\.\d+.*\.tgz$/);
  await expect(link).toHaveAttribute('download', /\.tgz$/);
  await expect(link).not.toHaveAttribute('aria-disabled', 'true');
});

test('the download link says so when the tarball has not been packed yet', async ({ page }) => {
  await page.route('**/datagrid-*.tgz', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }),
  );
  await page.goto('/index.html');
  await expect(page.getByRole('link', { name: /datagrid-.*.tgz/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.locator('.download-note').first()).toContainText('npm pack');
});

test('dist files can be downloaded, and a missing one is marked', async ({ page }) => {
  await page.route('**/dist/datagrid.js', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: 'export {}' }),
  );
  await page.route('**/dist/datagrid.css', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }),
  );
  await page.goto('/index.html');

  const js = page.getByRole('link', { name: 'ดาวน์โหลด datagrid.js' });
  await expect(js).toHaveAttribute('href', '/dist/datagrid.js');
  await expect(js).toHaveAttribute('download', 'datagrid.js');
  await expect(js).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('link', { name: 'ดาวน์โหลด datagrid.css' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.locator('.download-note').nth(1)).toContainText('npm run build');
});
