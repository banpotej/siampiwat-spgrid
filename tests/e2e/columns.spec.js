import { expect, test } from '@playwright/test';

// purchase-order.html: columnPicker on, columnStorageKey 'purchase-orders'.
const STORAGE_KEY = 'spgrid:columns:purchase-orders';

test('hidden columns are remembered across a reload and can be shown again', async ({ page }) => {
  await page.goto('/purchase-order.html');
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();

  const vendor = page.getByRole('columnheader', { name: /ชื่อผู้ค้า/ });
  await expect(vendor).toBeVisible();

  await page.locator('.spg-columns-btn').click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await modal.getByRole('checkbox', { name: /ชื่อผู้ค้า/ }).uncheck();
  await expect(vendor).toBeVisible(); // nothing changes until Apply
  await modal.locator('.spg-modal-ok').click();
  await expect(modal).toBeHidden();
  await expect(vendor).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('columnheader', { name: /ชื่อผู้ค้า/ })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toContain('vendor');

  await page.locator('.spg-columns-btn').click();
  await page
    .getByRole('dialog')
    .getByRole('checkbox', { name: /ชื่อผู้ค้า/ })
    .check();
  await page.getByRole('dialog').locator('.spg-modal-ok').click();
  await expect(page.getByRole('columnheader', { name: /ชื่อผู้ค้า/ })).toBeVisible();
});

test('Escape closes the modal without applying and returns focus to the button', async ({
  page,
}) => {
  await page.goto('/purchase-order.html');
  const button = page.locator('.spg-columns-btn');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(button).toBeFocused();
});
