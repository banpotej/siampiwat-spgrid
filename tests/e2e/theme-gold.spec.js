import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Locator} el */
const backgroundImage = (el) => el.evaluate((node) => getComputedStyle(node).backgroundImage);

test('the gold example applies the theme to its grid', async ({ page }) => {
  await page.goto('/theme-gold.html');
  await expect(page.locator('#grid')).toHaveClass(/spg-theme-gold/);
  await expect(page.locator('tbody tr')).toHaveCount(5);

  const root = page.locator('.spg-root');
  await expect(root).toHaveCSS('border-top-left-radius', '4px');
  await expect(root).toHaveCSS('border-top-color', 'rgb(227, 216, 191)');
  const th = page.locator('thead th').first();
  expect(await backgroundImage(th)).toContain('linear-gradient');
  await expect(th).toHaveCSS('color', 'rgb(59, 51, 34)');
  await expect(page.locator('tbody tr:nth-child(2)')).toHaveCSS(
    'background-color',
    'rgb(250, 246, 236)',
  );
});

test('dark mode swaps in the dark gold colours', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/theme-gold.html');
  await expect(page.locator('.spg-root')).toHaveCSS('background-color', 'rgb(23, 20, 13)');
  expect(await backgroundImage(page.locator('thead th').first())).toContain('rgb(52, 44, 25)');
});

test('the gold example has search and a Settings modal', async ({ page }) => {
  await page.goto('/theme-gold.html');
  await page.getByRole('searchbox').fill('บัญชี');
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  await expect(page.locator('.spg-settings')).toBeVisible();
});
