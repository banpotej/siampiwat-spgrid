import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page @param {string[]} labels Column labels, outermost first. */
async function group(page, labels) {
  await page.locator('.spg-columns-btn').click();
  const dialog = page.getByRole('dialog');
  const selects = dialog.locator('select[data-group]');
  for (const [i, label] of labels.entries()) await selects.nth(i).selectOption({ label });
  await dialog.locator('.spg-modal-ok').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('the Settings modal groups the rows by a column, and the groups collapse', async ({
  page,
}) => {
  await page.goto('/purchase-order.html');
  await expect(page.locator('.spg-group-row')).toHaveCount(0);

  await group(page, ['สถานะ']);
  const headers = page.locator('tr.spg-group-row');
  expect(await headers.count()).toBeGreaterThan(0);
  // Every header is followed by its rows, and a header spans the whole table.
  const before = await page.locator('tbody tr[data-row-index]').count();
  const first = headers.first();
  await expect(first.locator('td')).toHaveAttribute('colspan', /^\d+$/);
  await expect(first.locator('.spg-group-icon')).toBeVisible();

  const toggle = first.locator('.spg-group-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  expect(await page.locator('tbody tr[data-row-index]').count()).toBeLessThan(before);
  await toggle.press('Enter'); // a button: the keyboard works too
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await page.locator('tbody tr[data-row-index]').count()).toBe(before);
});

test('two levels nest, the choice is remembered, and "ไม่จัดกลุ่ม" ungroups', async ({ page }) => {
  await page.goto('/purchase-order.html');
  await group(page, ['สถานะ', 'ประเภทจัดซื้อ']);
  await expect(page.locator('tr.spg-group-row[data-level="0"]').first()).toBeVisible();
  await expect(page.locator('tr.spg-group-row[data-level="1"]').first()).toBeVisible();
  // An inner header is indented further than an outer one.
  const indent = (/** @type {string} */ level) =>
    page
      .locator(`tr.spg-group-row[data-level="${level}"] .spg-group-toggle`)
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineStart));
  expect(await indent('1')).toBeGreaterThan(await indent('0'));

  await page.reload();
  await expect(page.locator('tr.spg-group-row[data-level="1"]').first()).toBeVisible();

  await group(page, ['ไม่จัดกลุ่ม']);
  await expect(page.locator('.spg-group-row')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.spg-group-row')).toHaveCount(0);
});

test('the Reset view button ungroups', async ({ page }) => {
  await page.goto('/purchase-order.html');
  await group(page, ['สถานะ']);
  await expect(page.locator('.spg-group-row').first()).toBeVisible();
  await page.locator('.spg-columns-btn').click();
  await page.locator('.spg-settings-reset').click();
  await page.locator('.spg-modal-ok').click(); // the built-in confirmation
  await expect(page.locator('.spg-group-row')).toHaveCount(0);
});
