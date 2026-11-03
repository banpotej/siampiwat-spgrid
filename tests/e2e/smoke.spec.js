import { test, expect } from '@playwright/test';

test('example page renders the grid', async ({ page }) => {
  await page.goto('/basic.html');
  await expect(page.locator('th')).toHaveText(['ID', 'Name', 'Role']);
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await expect(page.locator('tbody tr').nth(2).locator('td').nth(1)).toHaveText('<b>Eve</b>');
});
