import { expect, test } from '@playwright/test';

const WARNING = 'rgb(194, 65, 12)';
const DANGER = 'rgb(185, 28, 28)';
const WHITE = 'rgb(255, 255, 255)';

/** @param {import('@playwright/test').Locator} el */
const backgroundImage = (el) => el.evaluate((node) => getComputedStyle(node).backgroundImage);

test('the lavender example applies the theme to its grid', async ({ page }) => {
  await page.goto('/theme-lavender.html');
  await expect(page.locator('#grid')).toHaveClass(/spg-theme-lavender/);
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await expect(page.locator('thead th')).toHaveText(
    ['ID', 'Document Type', 'Field Key', 'Attribute', 'Active', 'Action'],
    { useInnerText: true },
  );

  const root = page.locator('.spg-root');
  await expect(root).toHaveCSS('border-top-left-radius', '4px');
  await expect(root).toHaveCSS('border-top-color', 'rgb(217, 210, 238)');
  const th = page.locator('thead th').first();
  expect(await backgroundImage(th)).toContain('linear-gradient');
  await expect(th).toHaveCSS('color', 'rgb(55, 65, 81)');
  await expect(page.locator('tbody tr:nth-child(2)')).toHaveCSS(
    'background-color',
    'rgb(246, 243, 252)',
  );
  // gridLines: 'both': a line on the end side of every cell but the last, and under every row.
  const td = page.locator('tbody tr:nth-child(1) td').first();
  await expect(td).toHaveCSS('border-inline-end-color', 'rgb(217, 210, 238)');
  await expect(td).not.toHaveCSS('border-inline-end-width', '0px');
});

test('Yes is a green badge and Edit / Delete are solid with white text', async ({ page }) => {
  await page.goto('/theme-lavender.html');
  await expect(page.locator('.spg-badge-success').first()).toHaveText('Yes');
  const edit = page.getByRole('button', { name: 'Edit' }).first();
  const del = page.getByRole('button', { name: 'Delete' }).first();
  await expect(edit).toHaveCSS('background-color', WARNING);
  await expect(edit).toHaveCSS('color', WHITE);
  await expect(del).toHaveCSS('background-color', DANGER);
  await expect(del).toHaveCSS('color', WHITE);

  await page.getByRole('button', { name: 'Delete' }).nth(1).click();
  await expect(page.locator('#log')).toHaveText('delete: vendor_name');
});

test('the sticky header keeps its position and gradient under the theme', async ({ page }) => {
  await page.goto('/theme-lavender.html');
  await page.locator('.spg-root').evaluate((el) => el.classList.add('spg-sticky'));
  const th = page.locator('thead th').first();
  await expect(th).toHaveCSS('position', 'sticky');
  await expect(th).toHaveCSS('top', '0px');
  expect(await backgroundImage(th)).toContain('linear-gradient');
});

test('dark mode swaps in the dark lavender colours', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/theme-lavender.html');
  await expect(page.locator('.spg-root')).toHaveCSS('background-color', 'rgb(23, 18, 31)');
  expect(await backgroundImage(page.locator('thead th').first())).toContain('rgb(45, 36, 69)');
  await expect(page.getByRole('button', { name: 'Edit' }).first()).toHaveCSS(
    'color',
    'rgb(11, 18, 32)',
  );
});

test('a grid without the theme keeps the default look', async ({ page }) => {
  await page.goto('/basic.html');
  const th = page.locator('thead th').first();
  await expect(th).toHaveCSS('background-image', 'none');
  await expect(th).toHaveCSS('color', 'rgb(75, 85, 99)'); // still the muted text, not the header colour
  await expect(page.locator('.spg-root')).toHaveCSS('border-top-left-radius', '8px');
  await expect(page.locator('.spg-root')).toHaveCSS('border-top-color', 'rgb(229, 231, 235)');
});
