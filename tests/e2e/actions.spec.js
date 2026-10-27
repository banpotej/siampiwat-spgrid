import { expect, test } from '@playwright/test';

// tests/e2e/fixtures/actions.html: 25 rows (ids 1-25), pageSize 5; Cancel only on ids divisible by 3.
/** @param {import('@playwright/test').Page} page */
const grid = (page) => page.locator('#grid');
/** @param {import('@playwright/test').Page} page */
const log = (page) => page.locator('#log');

test('after sorting and paging, View and Cancel report the clicked row', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/actions.html');
  const idHeader = page.getByRole('columnheader', { name: 'ID' });
  await idHeader.click();
  await idHeader.click(); // descending: 25 24 23 22 21 | 20 19 18 17 16 | ...
  await grid(page).getByRole('button', { name: '2', exact: true }).click();
  await expect(grid(page).locator('tbody tr td:nth-child(3)')).toHaveText([
    '20',
    '19',
    '18',
    '17',
    '16',
  ]);

  await grid(page).getByRole('button', { name: 'View' }).nth(1).click();
  await expect(log(page)).toHaveText('view 19 19');

  // Cancel exists only for 18 (and 21, 24 on other pages): it is the only one on this page.
  const cancels = grid(page).getByRole('button', { name: 'Cancel' });
  await expect(cancels).toHaveCount(1);
  await cancels.click();
  await expect(log(page)).toHaveText('cancel 18 18');
});

test('a link rendered by the column fires the same action event, and search narrows the rows', async ({
  page,
}) => {
  await page.goto('/tests/e2e/fixtures/actions.html');
  await page.getByRole('searchbox').fill('user 7');
  await expect(grid(page).locator('tbody tr')).toHaveCount(2); // 7 and 17; also waits out the debounce
  await grid(page).getByRole('link', { name: 'User 7', exact: true }).click();
  await expect(log(page)).toHaveText('open 7 7');
});

test('action headers are not sortable', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/actions.html');
  const first = page.locator('thead th').first();
  await expect(first).not.toHaveAttribute('tabindex', /.*/);
  await first.click();
  await expect(page.locator('th[aria-sort]')).toHaveCount(0);
});
