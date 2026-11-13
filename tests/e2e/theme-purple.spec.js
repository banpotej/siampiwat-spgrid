import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Locator} el */
const backgroundImage = (el) => el.evaluate((node) => getComputedStyle(node).backgroundImage);

test('the purple example applies the theme to its grid', async ({ page }) => {
  await page.goto('/theme-purple.html');
  await expect(page.locator('#grid')).toHaveClass(/spg-theme-purple/);
  await expect(page.locator('tbody tr')).toHaveCount(5);

  const root = page.locator('.spg-root');
  await expect(root).toHaveCSS('border-top-left-radius', '4px');
  await expect(root).toHaveCSS('border-top-color', 'rgb(221, 214, 230)');
  const th = page.locator('thead th').first();
  expect(await backgroundImage(th)).toContain('linear-gradient');
  await expect(th).toHaveCSS('color', 'rgb(58, 45, 75)');
  await expect(page.locator('tbody tr:nth-child(2)')).toHaveCSS(
    'background-color',
    'rgb(248, 246, 251)',
  );
});

test('dark mode swaps in the dark purple colours', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/theme-purple.html');
  await expect(page.locator('.spg-root')).toHaveCSS('background-color', 'rgb(21, 17, 28)');
  expect(await backgroundImage(page.locator('thead th').first())).toContain('rgb(46, 36, 64)');
});

test('the purple example has search and a Settings modal', async ({ page }) => {
  await page.goto('/theme-purple.html');
  await page.getByRole('searchbox').fill('บัญชี');
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  await expect(page.locator('.spg-settings')).toBeVisible();
});
