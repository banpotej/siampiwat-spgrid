import { expect, test } from '@playwright/test';

test('a preset button changes the look and the controls follow', async ({ page }) => {
  await page.goto('/view-settings.html');
  await expect(page.locator('.spg-root')).toHaveClass(/spg-striped/);
  await expect(page.getByRole('button', { name: 'ตั้งค่า' })).toHaveCount(0);

  await page.getByRole('button', { name: 'ตรวจสอบ' }).click();
  await expect(page.locator('#log')).toContainText('"gridLines":"both"');
  await expect(page.locator('#log')).toContainText('"freezeColumns":2');
  await expect(page.locator('[name="gridLines"]')).toHaveValue('both');
  await expect(page.locator('[name="lineStyle"]')).toHaveValue('dashed');
  await expect(page.locator('[name="freezeColumns"]')).toHaveValue('2');

  await page.getByRole('button', { name: 'เรียบ' }).click();
  await expect(page.locator('[name="gridLines"]')).toHaveValue('none');
  await expect(page.locator('[name="striped"]')).not.toBeChecked();
});

test('one control changes only its own setting', async ({ page }) => {
  await page.goto('/view-settings.html');
  await page.locator('[name="wrapped"]').uncheck();
  await expect(page.locator('#log')).toContainText('"wrapped":false');
  await expect(page.locator('#log')).toContainText('"striped":true');
});

test('a bad value throws and changes nothing', async ({ page }) => {
  await page.goto('/view-settings.html');
  await page.getByRole('button', { name: 'ลองค่าที่ไม่ถูกต้อง' }).click();
  await expect(page.locator('#log')).toContainText('RangeError');
  await expect(page.locator('#log')).toContainText('striped ยังเป็น true');
});

test('grouping is set from code, and the look is remembered across a reload', async ({ page }) => {
  await page.goto('/view-settings.html');
  await page.locator('#group-by').selectOption('department');
  await expect(page.locator('tr.spg-group-row')).toHaveCount(3);

  await page.getByRole('button', { name: 'ตรวจสอบ' }).click();
  await page.reload();
  await expect(page.locator('[name="gridLines"]')).toHaveValue('both');
  await expect(page.locator('#group-by')).toHaveValue('department');
});
