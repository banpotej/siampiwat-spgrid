import { test, expect } from '@playwright/test';

// examples/index.html: 25 rows (ids 1-25), pageSize 5, pageSizeOptions [5, 10, 25].
/** @param {import('@playwright/test').Page} page */
const ids = (page) => page.locator('tbody tr td:first-child');

test('starts on page 1 with the pager and summary', async ({ page }) => {
  await page.goto('/examples/index.html');
  await expect(ids(page)).toHaveText(['1', '2', '3', '4', '5']);
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
  await expect(page.getByText('Showing 1–5 of 25')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await expect(page.locator('[aria-current="page"]')).toHaveText('1');
});

test('Next moves through pages; a size of 10 gives rows 11-20 and a last page of 5', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  await page.getByLabel('Rows per page').selectOption('10');
  await expect(ids(page)).toHaveCount(10);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(ids(page)).toHaveText(['11', '12', '13', '14', '15', '16', '17', '18', '19', '20']);
  await expect(page.getByText('Showing 11–20 of 25')).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(ids(page)).toHaveText(['21', '22', '23', '24', '25']);
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await expect(page.getByText('Showing 21–25 of 25')).toBeVisible();
});

test('searching goes back to page 1', async ({ page }) => {
  await page.goto('/examples/index.html');
  await page.getByRole('button', { name: '3', exact: true }).click();
  await expect(page.locator('[aria-current="page"]')).toHaveText('3');

  await page.getByRole('searchbox').fill('user 2');
  await expect(page.locator('[aria-current="page"]')).toHaveText('1');
  await expect(page.getByText('Showing 1–5 of 7')).toBeVisible();

  await page.getByRole('searchbox').fill('zzz');
  await expect(page.locator('tbody tr')).toHaveCount(1); // waits out the debounce
  await expect(page.locator('tbody td')).toHaveText('No data');
  await expect(page.getByText('Showing 0 of 0')).toBeVisible();
});

test('sorting goes back to page 1 and sorts across all pages', async ({ page }) => {
  await page.goto('/examples/index.html');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(ids(page).first()).toHaveText('6');

  const id = page.locator('th', { hasText: 'ID' });
  await id.click();
  await id.click(); // desc
  await expect(page.locator('[aria-current="page"]')).toHaveText('1');
  await expect(ids(page)).toHaveText(['25', '24', '23', '22', '21']);
});

test('focus stays on the pager while paging with the keyboard', async ({ page }) => {
  await page.goto('/examples/index.html');
  const next = page.getByRole('button', { name: 'Next' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(ids(page).first()).toHaveText('6');
  await expect(next).toBeFocused();

  // Walk to the last page: Next becomes disabled and focus moves to the nav.
  for (let i = 0; i < 3; i++) await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toBeFocused();
});
