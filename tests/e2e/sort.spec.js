import { test, expect } from '@playwright/test';

test('clicking a header cycles asc -> desc -> none', async ({ page }) => {
  await page.goto('/examples/basic.html');
  const role = page.locator('th', { hasText: 'Role' });
  const names = page.locator('tbody tr td:nth-child(2)');

  await expect(names).toHaveText(['Ada', 'Grace', '<b>Eve</b>']);

  await role.click(); // Admiral, Engineer, Tester
  await expect(role).toHaveAttribute('aria-sort', 'ascending');
  await expect(names).toHaveText(['Grace', 'Ada', '<b>Eve</b>']);

  await role.click();
  await expect(role).toHaveAttribute('aria-sort', 'descending');
  await expect(names).toHaveText(['<b>Eve</b>', 'Ada', 'Grace']);

  await role.click();
  await expect(role).not.toHaveAttribute('aria-sort', /.*/);
  await expect(names).toHaveText(['Ada', 'Grace', '<b>Eve</b>']);
});

test('keyboard: Enter on a focused header sorts', async ({ page }) => {
  await page.goto('/examples/basic.html');
  const role = page.locator('th', { hasText: 'Role' });
  await role.focus();
  await page.keyboard.press('Enter');
  await expect(role).toHaveAttribute('aria-sort', 'ascending');
  await expect(role).toBeFocused();
});
