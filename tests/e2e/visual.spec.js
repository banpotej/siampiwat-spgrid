import { test, expect } from '@playwright/test';

// Screenshots for manual review (no snapshot assertions yet): test-results/visual/*.png.
// Each test also checks the page really rendered the four example grids.
const shots = [
  { name: 'light', colorScheme: /** @type {const} */ ('light'), width: 1000 },
  { name: 'dark', colorScheme: /** @type {const} */ ('dark'), width: 1000 },
  { name: 'light-narrow', colorScheme: /** @type {const} */ ('light'), width: 480 },
  { name: 'dark-narrow', colorScheme: /** @type {const} */ ('dark'), width: 480 },
];

for (const { name, colorScheme, width } of shots) {
  test(`screenshot: examples page, ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme });
    await page.goto('/examples/index.html');
    await expect(page.locator('.dg-root')).toHaveCount(4);

    // Hover a header and open a few states so the shot shows more than the idle look.
    await page.locator('#grid-default th', { hasText: 'Name' }).click();
    await page.locator('#grid-default th', { hasText: 'Role' }).hover();
    await page.locator('#grid-default').getByRole('searchbox').fill('user');
    await expect(page.locator('#grid-default').getByText('แสดง 1–5 จาก 22 รายการ')).toBeVisible();

    await page.screenshot({ path: `test-results/visual/${name}.png`, fullPage: true });
  });
}

test('the empty state screenshot shows the inbox icon', async ({ page }) => {
  await page.goto('/examples/index.html');
  const search = page.locator('#grid-default').getByRole('searchbox');
  await search.fill('zzz');
  await expect(page.locator('#grid-default [data-icon="inbox"]')).toBeVisible();
  await page.locator('#grid-default').screenshot({ path: 'test-results/visual/empty.png' });
});
