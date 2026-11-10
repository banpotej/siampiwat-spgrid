import { expect, test } from '@playwright/test';

// examples/purchase-order.html: the Advanced filter button (filter_list icon) opens a modal of condition rows.
// Column 7 is the status badge column (เสร็จสิ้น, รออนุมัติ, ไม่อนุมัติ, ยกเลิก).
test('builds a multi-condition filter in the modal, shows chips, and removes them', async ({
  page,
}) => {
  await page.goto('/purchase-order.html');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(10);
  const button = page.getByRole('button', { name: 'ตัวกรองขั้นสูง' });
  await expect(button).not.toHaveAttribute('data-active', /.*/);

  await button.click();
  const dialog = page.getByRole('dialog', { name: 'ตัวกรองขั้นสูง' });
  await expect(dialog).toBeVisible();

  // Row 1: status is one of เสร็จสิ้น, ยกเลิก.
  const first = dialog.locator('.spg-adv-row').nth(0);
  await first.locator('.spg-adv-field').selectOption('status');
  await first.getByText('เสร็จสิ้น', { exact: true }).click();
  await first.getByText('ยกเลิก', { exact: true }).click();
  // Row 2: the vendor name contains a word.
  await dialog.getByRole('button', { name: /เพิ่มเงื่อนไข/ }).click();
  const second = dialog.locator('.spg-adv-row').nth(1);
  await second.locator('.spg-adv-field').selectOption('vendor');
  await second.locator('.spg-adv-input').fill('บริษัท');
  await dialog.getByRole('button', { name: 'ตกลง' }).click();

  await expect(dialog).toBeHidden();
  await expect(button).toHaveAttribute('data-active', '');
  const statuses = await rows.locator('td:nth-child(7)').allTextContents();
  expect(statuses.length).toBeGreaterThan(0);
  for (const text of statuses) expect(text).toMatch(/เสร็จสิ้น|ยกเลิก/);
  const chips = page.locator('.spg-chip-text');
  await expect(chips).toHaveCount(2);
  await expect(chips.nth(0)).toContainText('สถานะ เป็นหนึ่งใน');

  // Removing a chip drops one condition; removing the last one clears the filter.
  await page.getByRole('button', { name: /ลบตัวกรอง สถานะ/ }).click();
  await expect(chips).toHaveCount(1);
  await page.getByRole('button', { name: /ลบตัวกรอง/ }).click();
  await expect(chips).toHaveCount(0);
  await expect(button).not.toHaveAttribute('data-active', /.*/);
  await expect(rows).toHaveCount(10);
});

test('the Reset view button clears the advanced filter', async ({ page }) => {
  await page.goto('/purchase-order.html');
  await page.getByRole('button', { name: 'ตัวกรองขั้นสูง' }).click();
  const dialog = page.getByRole('dialog', { name: 'ตัวกรองขั้นสูง' });
  const row = dialog.locator('.spg-adv-row').first();
  await row.locator('.spg-adv-field').selectOption('status');
  await row.getByText('ยกเลิก', { exact: true }).click();
  await dialog.getByRole('button', { name: 'ตกลง' }).click();
  await expect(page.locator('.spg-chip')).toHaveCount(1);

  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  await page.getByRole('button', { name: 'รีเซ็ตมุมมอง' }).click();
  await page.getByRole('button', { name: 'รีเซ็ต', exact: true }).click();
  await expect(page.locator('.spg-chip')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ตัวกรองขั้นสูง' })).not.toHaveAttribute(
    'data-active',
    /.*/,
  );
});
