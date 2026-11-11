import { expect, test } from '@playwright/test';

test('the worklist example shows one group of three-line tasks with its count', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  const header = page.locator('tr.spg-group-row');
  await expect(header).toHaveCount(1);
  await expect(header).toContainText('Worklist — รออนุมัติ');
  await expect(header.locator('.spg-group-count')).toHaveText('7 งาน');

  const tasks = page.locator('tbody tr[data-row-index] .task');
  await expect(tasks).toHaveCount(7);
  const first = tasks.first();
  await expect(first.locator('.task-code')).toHaveText('OS26-F00122-03');
  await expect(first.locator('.task-title')).toHaveText('ร่มพับ สีแดงเลือดหมู ด้ามดำ');
  await expect(first.locator('.task-meta')).toHaveText([
    'สถานที่เก็บ: ห้อง L&F',
    'วันที่ขอ วันนี้ 11:48',
  ]);
});

test('the header row is not drawn but stays for screen readers', async ({ page }) => {
  await page.goto('/worklist.html');
  const head = page.locator('thead');
  await expect(head).toHaveCount(1);
  const box = await head.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(1);
});

test('a group collapses and a task opens on double-click', async ({ page }) => {
  await page.goto('/worklist.html');
  await page.locator('tbody tr[data-row-index]').first().dblclick();
  await expect(page.locator('#log')).toHaveText('เปิดงาน: OS26-F00122-03');
  await page.locator('.spg-group-toggle').click();
  await expect(page.locator('tbody tr[data-row-index]')).toHaveCount(0);
});
