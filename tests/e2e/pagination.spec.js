import { test, expect } from '@playwright/test';

// tests/e2e/fixtures/grids.html, first grid (#grid-default): 25 rows (ids 1-25), pageSize 5, pageSizeOptions [5, 10, 25].
// The page shows several grids, so everything is scoped to this one.
/** @param {import('@playwright/test').Page} page */
const grid = (page) => page.locator('#grid-default');
/** @param {import('@playwright/test').Page} page */
const ids = (page) => grid(page).locator('tbody tr td:first-child');

test('starts on page 1 with the pager and summary', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/grids.html');
  await expect(ids(page)).toHaveText(['1', '2', '3', '4', '5']);
  await expect(grid(page).getByRole('navigation', { name: 'การแบ่งหน้า' })).toBeVisible();
  await expect(grid(page).getByText('แสดง 1–5 จาก 25 รายการ')).toBeVisible();
  await expect(grid(page).getByRole('button', { name: 'ก่อนหน้า' })).toBeDisabled();
  await expect(grid(page).locator('[aria-current="page"]')).toHaveText('1');
});

test('Next moves through pages; a size of 10 gives rows 11-20 and a last page of 5', async ({
  page,
}) => {
  await page.goto('/tests/e2e/fixtures/grids.html');
  await grid(page).getByLabel('จำนวนแถวต่อหน้า').selectOption('10');
  await expect(ids(page)).toHaveCount(10);

  await grid(page).getByRole('button', { name: 'ถัดไป' }).click();
  await expect(ids(page)).toHaveText(['11', '12', '13', '14', '15', '16', '17', '18', '19', '20']);
  await expect(grid(page).getByText('แสดง 11–20 จาก 25 รายการ')).toBeVisible();

  await grid(page).getByRole('button', { name: 'ถัดไป' }).click();
  await expect(ids(page)).toHaveText(['21', '22', '23', '24', '25']);
  await expect(grid(page).getByRole('button', { name: 'ถัดไป' })).toBeDisabled();
  await expect(grid(page).getByText('แสดง 21–25 จาก 25 รายการ')).toBeVisible();
});

test('searching goes back to page 1', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/grids.html');
  await grid(page).getByRole('button', { name: '3', exact: true }).click();
  await expect(grid(page).locator('[aria-current="page"]')).toHaveText('3');

  await grid(page).getByRole('searchbox').fill('user 2');
  await expect(grid(page).locator('[aria-current="page"]')).toHaveText('1');
  await expect(grid(page).getByText('แสดง 1–5 จาก 7 รายการ')).toBeVisible();

  await grid(page).getByRole('searchbox').fill('zzz');
  await expect(grid(page).locator('tbody tr')).toHaveCount(1); // waits out the debounce
  await expect(grid(page).locator('tbody td')).toHaveText('ไม่พบข้อมูล');
  await expect(grid(page).getByText('แสดง 0 จาก 0 รายการ')).toBeVisible();
});

test('sorting goes back to page 1 and sorts across all pages', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/grids.html');
  await grid(page).getByRole('button', { name: 'ถัดไป' }).click();
  await expect(ids(page).first()).toHaveText('6');

  const id = grid(page).locator('th', { hasText: 'ID' });
  await id.click();
  await id.click(); // desc
  await expect(grid(page).locator('[aria-current="page"]')).toHaveText('1');
  await expect(ids(page)).toHaveText(['25', '24', '23', '22', '21']);
});

test('focus stays on the pager while paging with the keyboard', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/grids.html');
  const next = grid(page).getByRole('button', { name: 'ถัดไป' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(ids(page).first()).toHaveText('6');
  await expect(next).toBeFocused();

  // Walk to the last page: Next becomes disabled and focus moves to the nav.
  for (let i = 0; i < 3; i++) await page.keyboard.press('Enter');
  await expect(grid(page).getByRole('button', { name: 'ถัดไป' })).toBeDisabled();
  await expect(grid(page).getByRole('navigation', { name: 'การแบ่งหน้า' })).toBeFocused();
});
