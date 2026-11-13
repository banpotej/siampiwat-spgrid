import { expect, test } from '@playwright/test';

const WARNING = 'rgb(180, 83, 9)';
const DANGER = 'rgb(185, 28, 28)';
const WHITE = 'rgb(255, 255, 255)';

/** @param {import('@playwright/test').Locator} el */
const backgroundImage = (el) => el.evaluate((node) => getComputedStyle(node).backgroundImage);

test('the default example applies the theme to its grid', async ({ page }) => {
  await page.goto('/theme-default.html');
  await expect(page.locator('#grid')).not.toHaveClass(/spg-theme/);
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await expect(page.locator('thead th')).toHaveText(
    ['รหัส', 'ชื่อ-นามสกุล', 'แผนก', 'ตำแหน่ง', 'สถานะ', 'การดำเนินการ'],
    { useInnerText: true },
  );

  const root = page.locator('.spg-root');
  await expect(root).toHaveCSS('border-top-left-radius', '8px');
  await expect(root).toHaveCSS('border-top-color', 'rgb(229, 231, 235)');
  const th = page.locator('thead th').first();
  expect(await backgroundImage(th)).toBe('none');
  await expect(th).toHaveCSS('color', 'rgb(75, 85, 99)');
  // gridLines: 'both': a line on the end side of every cell but the last, and under every row.
  const td = page.locator('tbody tr:nth-child(1) td').first();
  await expect(td).toHaveCSS('border-inline-end-color', 'rgb(229, 231, 235)');
  await expect(td).not.toHaveCSS('border-inline-end-width', '0px');
});

test('the active badge is green and แก้ไข / ลบ are solid with white text', async ({ page }) => {
  await page.goto('/theme-default.html');
  await expect(page.locator('.spg-badge-success').first()).toHaveText('ใช้งาน');
  const edit = page.getByRole('button', { name: 'แก้ไข' }).first();
  const del = page.getByRole('button', { name: 'ลบ' }).first();
  await expect(edit).toHaveCSS('background-color', WARNING);
  await expect(edit).toHaveCSS('color', WHITE);
  await expect(del).toHaveCSS('background-color', DANGER);
  await expect(del).toHaveCSS('color', WHITE);

  await page.getByRole('button', { name: 'ลบ' }).nth(1).click();
  await expect(page.locator('#log')).toHaveText('delete: สมหญิง รักเรียน');
});

test('the default example has search and a Settings modal like the PO list', async ({ page }) => {
  await page.goto('/theme-default.html');
  await page.getByRole('searchbox').fill('บัญชี');
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);

  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  await expect(page.locator('.spg-settings')).toBeVisible();
});

test('a grid without the theme keeps the default look', async ({ page }) => {
  await page.goto('/basic.html');
  const th = page.locator('thead th').first();
  await expect(th).toHaveCSS('background-image', 'none');
  await expect(th).toHaveCSS('color', 'rgb(75, 85, 99)');
});
