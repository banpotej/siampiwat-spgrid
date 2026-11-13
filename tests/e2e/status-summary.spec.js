import { expect, test } from '@playwright/test';

test('each status is a row with a label, a bar sized by its count, and the count', async ({
  page,
}) => {
  await page.goto('/status-summary.html');
  await expect(page.locator('.spg-title')).toHaveText('สรุป 2 ปี แยกตามสถานะ');
  const rows = page.locator('tbody tr[data-row-index]');
  await expect(rows).toHaveCount(10);
  const first = rows.first();
  await expect(first.locator('td').first()).toHaveText('รับเข้า');
  await expect(first.locator('td').last()).toHaveText('17');
  // The largest count fills the track; a smaller one is shorter; a zero draws no bar.
  /** @param {import('@playwright/test').Locator} row */
  const width = async (row) => (await row.locator('.bar-fill').boundingBox())?.width ?? 0;
  const track = (await first.locator('.bar-track').boundingBox())?.width ?? 0;
  expect(await width(first)).toBeCloseTo(track, 0);
  expect(await width(rows.nth(2))).toBeLessThan(await width(first));
  await expect(rows.nth(1).locator('.bar-fill')).toBeHidden();
});

test('the header row is not drawn but stays for screen readers', async ({ page }) => {
  await page.goto('/status-summary.html');
  const box = await page.locator('thead').boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(1);
});
