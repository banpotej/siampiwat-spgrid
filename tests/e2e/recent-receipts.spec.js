import { expect, test } from '@playwright/test';

test('the card has a title, a row count and one row per receipt with a badge', async ({ page }) => {
  await page.goto('/recent-receipts.html');
  await expect(page.locator('.spg-title')).toHaveText('รับเข้าล่าสุด (นับเป็นรายการ)');
  await expect(page.locator('.spg-count')).toHaveText('5 รายการ');
  const rows = page.locator('tbody tr[data-row-index]');
  await expect(rows).toHaveCount(5);
  const first = rows.first();
  await expect(first.locator('.receipt-code')).toHaveText('OS26-F00126-01');
  await expect(first.locator('.receipt-name')).toHaveText('สมาร์ทโฟน');
  await expect(first.locator('.receipt-meta')).toHaveText('หมวด: อิเล็กทรอนิกส์ · 1 ชิ้น');
  await expect(first.locator('.receipt-time')).toHaveText(/^วันนี้ \d{2}:\d{2}$/);
  await expect(rows.nth(3).locator('.receipt-time')).toHaveText(/^เมื่อวาน \d{2}:\d{2}$/);
  await expect(first.locator('.spg-badge')).toHaveText('รับเข้า');
});

test('the header row is not drawn but stays for screen readers', async ({ page }) => {
  await page.goto('/recent-receipts.html');
  const head = page.locator('thead');
  await expect(head).toHaveCount(1);
  const box = await head.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(1);
});
