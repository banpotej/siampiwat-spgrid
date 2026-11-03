import { expect, test } from '@playwright/test';

test('example page shows the source code of the grid it renders', async ({ page }) => {
  await page.goto('/purchase-order.html');
  const section = page.getByRole('region', { name: 'Source Code' });
  await expect(section.locator('code')).toContainText('new DataGrid(');
  await expect(section.locator('code')).toContainText('import { DataGrid, thaiLabels }');
});

test('source code starts hidden and can be shown and hidden', async ({ page }) => {
  await page.goto('/purchase-order.html');
  const heading = page.getByRole('heading', { name: 'Source Code' });
  const details = page.locator('#source details');
  const copy = page.locator('#source button');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(copy).toBeHidden();

  await heading.click();
  await expect(details).toHaveAttribute('open', '');
  await expect(copy).toBeVisible();

  await heading.click();
  await expect(details).not.toHaveAttribute('open', '');
  await expect(copy).toBeHidden();
});

test('source code is laid out one line per row, so it is actually visible', async ({ page }) => {
  await page.goto('/purchase-order.html');
  await page.getByRole('heading', { name: 'Source Code' }).click();
  const lines = page.locator('#source .line');
  const first = (await lines.nth(0).boundingBox())?.y ?? 0;
  const second = (await lines.nth(1).boundingBox())?.y ?? 0;
  expect(second).toBeGreaterThan(first + 5);
  const height = (await page.locator('#source pre').boundingBox())?.height ?? 0;
  expect(height).toBeGreaterThan(200);
});
