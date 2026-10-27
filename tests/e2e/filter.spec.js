import { test, expect } from '@playwright/test';

test('typing filters rows, clearing restores them', async ({ page }) => {
  await page.goto('/examples/basic.html');
  const search = page.getByRole('searchbox', { name: 'Search' });
  const rows = page.locator('tbody tr');

  await expect(rows).toHaveCount(3);
  await search.fill('ada');
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('td').nth(1)).toHaveText('Ada');

  await search.fill('');
  await expect(rows).toHaveCount(3);
});

test('keeps focus and shows "No data" when nothing matches', async ({ page }) => {
  await page.goto('/examples/basic.html');
  const search = page.getByRole('searchbox', { name: 'Search' });
  await search.click();
  await page.keyboard.type('zzz');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody td')).toHaveText('No data');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('zzz');
});

test('filter combines with sort', async ({ page }) => {
  await page.goto('/examples/basic.html');
  const role = page.locator('th', { hasText: 'Role' });
  const names = page.locator('tbody tr td:nth-child(2)');

  await role.click();
  await role.click(); // desc: Tester, Engineer, Admiral
  await page.getByRole('searchbox').fill('er'); // Engineer, Tester
  await expect(names).toHaveText(['<b>Eve</b>', 'Ada']);
  await expect(role).toHaveAttribute('aria-sort', 'descending');

  await role.click(); // none -> original order, still filtered
  await expect(names).toHaveText(['Ada', '<b>Eve</b>']);
});
