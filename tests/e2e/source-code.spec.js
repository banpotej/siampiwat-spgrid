import { expect, test } from '@playwright/test';

test('example page shows the source code of the grid it renders', async ({ page }) => {
  await page.goto('/examples/index.html');
  const section = page.getByRole('region', { name: 'Source Code' });
  await expect(section.locator('code')).toContainText('new DataGrid(');
  await expect(section.locator('code')).toContainText('import { DataGrid, thaiLabels }');
});
