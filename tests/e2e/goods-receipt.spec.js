import { expect, test } from '@playwright/test';

test('goods receipt example shows badges, dashes for NULL, and its own source code', async ({
  page,
}) => {
  await page.goto('/goods-receipt.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Goods Receipt');
  await expect(page.locator('#grid tbody tr')).toHaveCount(10);
  // Newest first: the draft (177391) has no GR number or dates.
  const draft = page.locator('#grid tbody tr').first();
  await expect(page.getByRole('columnheader', { name: 'GoodsReceiptTableId' })).toHaveCount(0);
  await expect(draft).toContainText('ร่าง');
  await expect(page.locator('#grid .dg-badge').first()).toBeVisible();
  const source = page.getByRole('region', { name: 'Source Code' });
  await expect(source.locator('code')).toContainText('createGoodsReceipts');
  await expect(source.locator('.file')).toHaveText('examples/goods-receipt.js');
});

test('goods receipt row opens its details on double-click', async ({ page }) => {
  await page.goto('/goods-receipt.html');
  await page.locator('#grid tbody tr').nth(1).dblclick();
  await expect(page.getByRole('dialog')).toContainText('100/GR/C008800');
});
