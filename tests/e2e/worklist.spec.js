import { expect, test } from '@playwright/test';

test('the worklist example groups the items by document, each with its own count', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  await expect(page.locator('.spg-title')).toHaveText('Worklist — รออนุมัติ');
  const headers = page.locator('tr.spg-group-row');
  await expect(headers).toHaveCount(3);
  const doc = headers.first();
  await expect(doc.locator('.doc-code')).toHaveText('OS26-F00122');
  await expect(doc.locator('.doc-meta')).toHaveText('ชั้น 1 โซน A · รับเมื่อ วันนี้ 11:45');
  await expect(doc.locator('.spg-group-count')).toHaveText('· 3 รายการ');

  const tasks = page.locator('tbody tr[data-row-index] .task');
  await expect(tasks).toHaveCount(5);
  const first = tasks.first();
  await expect(first.locator('.task-code')).toHaveText('OS26-F00122-01');
  await expect(first.locator('.task-title')).toHaveText('อิเล็กทรอนิกส์');
  await expect(first).toHaveAttribute('data-cat', 'อิเล็กทรอนิกส์');
  await expect(first.locator('.task-qty')).toHaveText('1 ชิ้น');
  await expect(first.locator('.task-place')).toHaveText('ห้อง L&F');
  await expect(first.locator('.task-place')).toHaveAttribute('title', 'สถานที่เก็บ');
  await expect(first.locator('.task-asked')).toHaveText('วันนี้ 11:47');
  await expect(first.locator('.task-pieces li')).toHaveText([
    'สมาร์ทโฟน สีดำ เคสใส โทรศัพท์มือถือ',
  ]);
});

test('the header row is not drawn but stays for screen readers', async ({ page }) => {
  await page.goto('/worklist.html');
  const head = page.locator('thead');
  await expect(head).toHaveCount(1);
  const box = await head.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(1);
});

test('a group collapses and an item opens on double-click', async ({ page }) => {
  await page.goto('/worklist.html');
  await page.locator('tbody tr[data-row-index]').first().dblclick();
  await expect(page.locator('#log')).toHaveText('เปิดรายการ: OS26-F00122-01');
  await page.keyboard.press('Escape');
  await page.locator('.spg-group-toggle').first().click(); // the first document, with 3 of the 5 items
  await expect(page.locator('tbody tr[data-row-index]')).toHaveCount(2);
});

test('the group button fills its header row edge to edge', async ({ page }) => {
  await page.goto('/worklist.html');
  const cell = await page.locator('tr.spg-group-row td').first().boundingBox();
  const button = await page.locator('.spg-group-toggle').first().boundingBox();
  expect(button?.x).toBeCloseTo(cell?.x ?? -1, 0);
  expect(button?.width).toBeCloseTo(cell?.width ?? -1, 0);
});

test('the worklist has a Settings modal that changes the look', async ({ page }) => {
  await page.goto('/worklist.html');
  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  await expect(page.locator('.spg-settings')).toBeVisible();
  await expect(page.locator('tr.spg-group-row')).toHaveCount(3);
});

test('the worklist pages its items and filters them by search', async ({ page }) => {
  await page.goto('/worklist.html');
  await expect(page.locator('tbody tr[data-row-index]')).toHaveCount(5);
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await expect(page.locator('tbody tr[data-row-index]')).toHaveCount(1);
  await page.getByRole('searchbox').fill('F00118');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.locator('tbody tr[data-row-index]')).toHaveCount(1);
  await expect(page.locator('.task-code')).toHaveText('OS26-F00118-01');
});

test('the worklist has the toolbar of the purchase order list', async ({ page }) => {
  await page.goto('/worklist.html');
  for (const name of ['ส่งออก Excel', 'ตัวกรองขั้นสูง', 'โหลดข้อมูลใหม่']) {
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /ค้นหา/ }).first()).toBeVisible();
});

test('the advanced filter reaches the hidden fields, such as the category', async ({ page }) => {
  await page.goto('/worklist.html');
  await page.getByRole('button', { name: 'ตัวกรองขั้นสูง' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the worklist switches between the list and a calendar of the same items', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  await page.getByRole('searchbox').fill('F00122');
  await page.getByRole('searchbox').press('Enter');
  await page.getByRole('button', { name: 'แสดงเป็นปฏิทิน' }).click();
  await expect(page.locator('table')).toHaveCount(0);
  await expect(page.locator('.spg-cal-event')).toHaveCount(3);
  await expect(page.locator('.spg-cal-event-title').first()).toHaveText(/OS26-F00122-0\d/);

  await page.locator('.spg-cal-event').first().click();
  await expect(page.locator('#log')).toContainText('เปิดรายการ: OS26-F00122-0');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'แสดงเป็นตาราง' }).click();
  await expect(page.locator('.spg-cal')).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveValue('F00122');
  await expect(page.locator('tbody tr[data-row-index]')).toHaveCount(3);
});
