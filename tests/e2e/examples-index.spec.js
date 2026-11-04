import { expect, test } from '@playwright/test';

test('landing page lists each example as a card', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Siam Piwat DataGrid');
  const cards = page.locator('#examples');
  await expect(cards.getByRole('link')).toHaveCount(2);
  await cards.getByRole('link', { name: /Goods Receipt/ }).click();
  await expect(page).toHaveURL(/\/goods-receipt\.html$/);
});

test('the landing page carries the new name and the package version', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/^Siam Piwat DataGrid/);
  await expect(page.locator('#version')).toHaveText(/^v\d+\.\d+\.\d+$/);
  await expect(page.getByRole('link', { name: 'ดูตัวอย่างแรก' })).toBeVisible();
});

test('the landing page uses the Siam Piwat purple and gold', async ({ page }) => {
  // Pretend the tarball exists so the button is enabled; a missing file (as on CI) greys it out.
  await page.route('**/*datagrid-*.tgz', (route) =>
    route.fulfill({ status: 200, contentType: 'application/gzip', body: 'x' }),
  );
  await page.goto('/');
  const hero = page.locator('.hero');
  expect(await hero.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(
    'rgb(58, 45, 75)',
  );
  await expect(page.locator('.download-btn').first()).toHaveCSS(
    'background-color',
    'rgb(58, 45, 75)',
  );
  await expect(page.locator('.features li').first()).toHaveCSS(
    'border-left-color',
    'rgb(162, 132, 72)',
  );
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

  await nav.getByRole('link', { name: 'Siam Piwat DataGrid' }).click();
  await expect(page).toHaveURL(/localhost:5173\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Siam Piwat DataGrid');
});

test('landing page explains how to install the package', async ({ page }) => {
  await page.goto('/index.html');
  const install = page.getByRole('region', { name: 'การติดตั้ง' });
  await expect(install.locator('code').first()).toHaveText('npm install @siampiwat/datagrid');
  await expect(install).toContainText('datagrid/plain');
  await expect(install).toContainText('npm pack');
});

test('the install section offers the packed tarball for download when it exists', async ({
  page,
}) => {
  await page.route('**/*datagrid-*.tgz', (route) =>
    route.fulfill({ status: 200, contentType: 'application/gzip', body: 'x' }),
  );
  await page.goto('/index.html');
  const link = page.getByRole('link', { name: /ดาวน์โหลด siampiwat-datagrid-.*\.tgz/ });
  await expect(link).toHaveAttribute(
    'href',
    /^\/release\/siampiwat-datagrid-\d+\.\d+\.\d+.*\.tgz$/,
  );
  await expect(link).toHaveAttribute('download', /\.tgz$/);
  await expect(link).not.toHaveAttribute('aria-disabled', 'true');
});

test('the download link says so when the tarball has not been packed yet', async ({ page }) => {
  await page.route('**/*datagrid-*.tgz', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }),
  );
  await page.goto('/index.html');
  await expect(page.getByRole('link', { name: /siampiwat-datagrid-.*.tgz/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.locator('.download-note').first()).toContainText('pack:release');
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
  await expect(page.locator('.download-note').nth(2)).toContainText('npm run build');
});

test('the install section offers the zip, and says how to build it when it is missing', async ({
  page,
}) => {
  await page.route('**/release/*datagrid-*.zip', (route) =>
    route.fulfill({ status: 200, contentType: 'application/zip', body: 'PK' }),
  );
  await page.goto('/index.html');
  const zip = page.getByRole('link', { name: /siampiwat-datagrid-\d+\.\d+\.\d+\.zip/ });
  await expect(zip).toHaveAttribute('href', /^\/release\/siampiwat-datagrid-\d+\.\d+\.\d+\.zip$/);
  await expect(zip).toHaveAttribute('download', /^siampiwat-datagrid-\d+\.\d+\.\d+\.zip$/);
  await expect(zip).not.toHaveAttribute('aria-disabled', 'true');

  await page.unroute('**/release/*datagrid-*.zip');
  await page.route('**/release/*datagrid-*.zip', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }),
  );
  await page.reload();
  await expect(zip).toHaveAttribute('aria-disabled', 'true');
  await expect(zip.locator('xpath=..').locator('.download-note')).toContainText('pack:release');
});
