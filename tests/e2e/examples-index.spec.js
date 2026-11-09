import { expect, test } from '@playwright/test';

test('landing page lists each example as a card', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('SPGrid');
  const cards = page.locator('#examples');
  await expect(cards.getByRole('link')).toHaveCount(2);
  await cards.getByRole('link', { name: /Purchase Order/ }).click();
  await expect(page).toHaveURL(/\/purchase-order\.html$/);
});

test('the landing page carries the new name and the package version', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/^SPGrid/);
  await expect(page.locator('#version')).toHaveText(/^v\d+\.\d+\.\d+$/);
  await expect(page.getByRole('link', { name: 'ดูตัวอย่างแรก' })).toBeVisible();
});

test('the landing page shows the latest version published on npm', async ({ page }) => {
  await page.route('https://registry.npmjs.org/@siampiwat/spgrid/latest', (route) =>
    route.fulfill({ json: { name: '@siampiwat/spgrid', version: '9.8.7' } }),
  );
  await page.goto('/');
  await expect(page.locator('#version')).toHaveText('v9.8.7');
  await expect(page.locator('#footer-version')).toHaveText('v9.8.7');
  await expect(page.locator('.npm-version').first()).toHaveText('9.8.7');
  // Files built from this checkout keep the repo version.
  await expect(page.locator('#download-tgz')).not.toContainText('9.8.7');
});

test('the landing page keeps the package.json version when npm cannot be reached', async ({
  page,
}) => {
  await page.route('https://registry.npmjs.org/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#version')).toHaveText(/^v\d+\.\d+\.\d+$/);
  await expect(page.locator('#version')).not.toHaveText('v9.8.7');
});

test('the landing page uses the Siam Piwat purple and gold', async ({ page }) => {
  // Pretend the tarball exists so the button is enabled; a missing file (as on CI) greys it out.
  await page.route('**/*spgrid-*.tgz', (route) =>
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
  await expect(nav.getByRole('link', { name: 'ตัวอย่าง' })).toHaveAttribute('aria-current', 'page');

  await nav.getByRole('link', { name: 'SPGrid' }).click();
  await expect(page).toHaveURL(/localhost:5173\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('SPGrid');
});

test('landing page explains how to install the package', async ({ page }) => {
  await page.goto('/index.html');
  const install = page.getByRole('region', { name: 'การติดตั้ง' });
  await expect(install.locator('code').first()).toHaveText('npm install @siampiwat/spgrid');
  await expect(install).toContainText('spgrid/plain');
  await expect(install).toContainText('npm pack');
});

test('the install section offers the packed tarball for download when it exists', async ({
  page,
}) => {
  await page.route('**/*spgrid-*.tgz', (route) =>
    route.fulfill({ status: 200, contentType: 'application/gzip', body: 'x' }),
  );
  await page.goto('/index.html');
  const link = page.getByRole('link', { name: /ดาวน์โหลด siampiwat-spgrid-.*\.tgz/ });
  await expect(link).toHaveAttribute('href', /^\/release\/siampiwat-spgrid-\d+\.\d+\.\d+.*\.tgz$/);
  await expect(link).toHaveAttribute('download', /\.tgz$/);
  await expect(link).not.toHaveAttribute('aria-disabled', 'true');
});

test('the download link says so when the tarball has not been packed yet', async ({ page }) => {
  await page.route('**/*spgrid-*.tgz', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }),
  );
  await page.goto('/index.html');
  await expect(page.getByRole('link', { name: /siampiwat-spgrid-.*.tgz/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.locator('.download-note').first()).toContainText('pack:release');
});

test('dist files can be downloaded, and a missing one is marked', async ({ page }) => {
  await page.route('**/dist/spgrid.js', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: 'export {}' }),
  );
  await page.route('**/dist/spgrid.css', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }),
  );
  await page.goto('/index.html');

  const js = page.getByRole('link', { name: 'ดาวน์โหลด spgrid.js' });
  await expect(js).toHaveAttribute('href', '/dist/spgrid.js');
  await expect(js).toHaveAttribute('download', 'spgrid.js');
  await expect(js).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('link', { name: 'ดาวน์โหลด spgrid.css' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.locator('.download-note').nth(2)).toContainText('npm run build');
});

test('the install section offers the zip, and says how to build it when it is missing', async ({
  page,
}) => {
  await page.route('**/release/*spgrid-*.zip', (route) =>
    route.fulfill({ status: 200, contentType: 'application/zip', body: 'PK' }),
  );
  await page.goto('/index.html');
  const zip = page.getByRole('link', { name: /siampiwat-spgrid-\d+\.\d+\.\d+\.zip/ });
  await expect(zip).toHaveAttribute('href', /^\/release\/siampiwat-spgrid-\d+\.\d+\.\d+\.zip$/);
  await expect(zip).toHaveAttribute('download', /^siampiwat-spgrid-\d+\.\d+\.\d+\.zip$/);
  await expect(zip).not.toHaveAttribute('aria-disabled', 'true');

  await page.unroute('**/release/*spgrid-*.zip');
  await page.route('**/release/*spgrid-*.zip', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }),
  );
  await page.reload();
  await expect(zip).toHaveAttribute('aria-disabled', 'true');
  await expect(zip.locator('xpath=..').locator('.download-note')).toContainText('pack:release');
});

test('each code block on the landing page has a copy button', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const block = page.locator('.code-block').first();
  await block.getByRole('button', { name: 'คัดลอก' }).click();
  await expect(block.getByRole('button')).toHaveText('คัดลอกแล้ว');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'npm install @siampiwat/spgrid',
  );
  expect(await page.locator('.install pre').count()).toBe(
    await page.locator('.code-block').count(),
  );
});

test('the top nav looks the same on the landing page and the example pages', async ({ page }) => {
  const looks = [];
  for (const path of ['/', '/purchase-order.html']) {
    await page.goto(path);
    looks.push(
      await page.evaluate(() => {
        /** @param {Element} el @param {string[]} props */
        const css = (el, props) =>
          props
            .map(
              (p) =>
                /** @type {Record<string, string>} */ (
                  /** @type {unknown} */ (getComputedStyle(el))
                )[p],
            )
            .join('|');
        const nav = /** @type {Element} */ (document.querySelector('.site-nav'));
        const brand = /** @type {Element} */ (nav.querySelector('.brand'));
        const other = /** @type {Element} */ (
          nav.querySelector('a:not(.brand):not([aria-current])')
        );
        return [
          css(nav, ['borderBottomColor', 'marginBottom']),
          css(brand, ['color', 'fontWeight']),
          css(other, ['color', 'fontSize']),
        ].join('||');
      }),
    );
  }
  expect(looks[1]).toBe(looks[0]);
});

test('the Next.js quick start has its own page, reachable from the landing page and the nav', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Quick Start (Next.js)' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Quick Start (Next.js)' }).click();
  await expect(page).toHaveURL(/\/quick-start\.html$/);

  const quickstart = page.getByRole('region', { name: 'Quick Start (Next.js)' });
  await expect(quickstart).toContainText('create-next-app');
  await expect(quickstart).toContainText("'use client'");
  await expect(quickstart).toContainText("import('@siampiwat/spgrid')");
  await expect(quickstart.locator('.code-block')).toHaveCount(3);

  const nav = page.getByRole('navigation', { name: 'เมนูตัวอย่าง' });
  await expect(nav.getByRole('link', { name: 'Quick Start' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await nav.getByRole('link', { name: 'SPGrid' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('SPGrid');
});

test('the Claude Code page has its own page, reachable from the landing page and the nav', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'สำหรับ Claude Code' }).first().click();
  await expect(page).toHaveURL(/\/for-agents\.html$/);

  const guide = page.getByRole('region', { name: 'ใช้ SPGrid กับ Claude Code' });
  await expect(guide).toContainText('node_modules/@siampiwat/spgrid/docs/AGENT_GUIDE.md');
  await expect(guide).toContainText('escapeHtml()');
  await expect(guide).toContainText('destroy()');
  await expect(guide.locator('.code-block')).toHaveCount(5);

  const nav = page.getByRole('navigation', { name: 'เมนูตัวอย่าง' });
  await expect(nav.getByRole('link', { name: 'สำหรับ Claude Code' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});
