import { expect, test } from '@playwright/test';

// The example opens on the week of 8-14 Nov 2026, where the lost & found documents were received.
test.beforeEach(async ({ page }) => {
  await page.goto('/calendar.html');
});

test('the calendar example shows the received documents as events in a time grid', async ({
  page,
}) => {
  const calendar = page.locator('.spg-cal');
  await expect(calendar).toHaveAttribute('data-view', 'week');
  await expect(calendar.locator('.spg-cal-dayhead')).toHaveCount(7);
  await expect(calendar.locator('.spg-cal-col .spg-cal-event')).toHaveCount(8);
  await expect(calendar.getByText('OS26-F00125 · 3 รายการ')).toBeVisible();
  // Wednesday 11 Nov holds five receipts, each in its own time slot.
  await expect(calendar.locator('[data-day="2026-11-11"] .spg-cal-event')).toHaveCount(5);
  await expect(calendar.locator('[data-day="2026-11-10"] .spg-cal-event')).toHaveCount(3);
});

test('the events on one day do not cover each other', async ({ page }) => {
  const boxes = await page.locator('[data-day="2026-11-11"] .spg-cal-event').all();
  const rects = await Promise.all(boxes.map((box) => box.boundingBox()));
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = /** @type {NonNullable<typeof rects[0]>} */ (rects[i]);
      const b = /** @type {NonNullable<typeof rects[0]>} */ (rects[j]);
      const apart = a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1;
      expect(apart, `events ${i} and ${j} overlap`).toBe(true);
    }
  }
});

test('the view buttons switch between agenda, day, work week and week', async ({ page }) => {
  const calendar = page.locator('.spg-cal');
  await calendar.getByRole('button', { name: 'สัปดาห์ทำงาน' }).click();
  await expect(calendar.locator('.spg-cal-dayhead')).toHaveCount(5);
  await calendar.getByRole('button', { name: 'วัน', exact: true }).click();
  await expect(calendar.locator('.spg-cal-dayhead')).toHaveCount(1);
  await calendar.getByRole('button', { name: 'กำหนดการ' }).click();
  await expect(calendar.locator('.spg-cal-agenda-day')).toHaveCount(2); // 10 and 11 Nov
  await expect(calendar.getByRole('button', { name: 'กำหนดการ' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('four weeks on, each day whose 30 days end has one move-to-stock event', async ({ page }) => {
  const calendar = page.locator('.spg-cal');
  const next = calendar.getByRole('button', { name: 'ถัดไป' });
  const title = calendar.locator('.spg-cal-title');
  const opening = await title.textContent();
  for (let i = 0; i < 4; i++) await next.click();
  await expect(calendar.getByText('ย้าย Stock · 3 เอกสาร')).toBeVisible(); // 10 Dec
  await expect(calendar.getByText('ย้าย Stock · 5 เอกสาร')).toBeVisible(); // 11 Dec
  // The grid is drawn again, but focus stays on the button that was used.
  await expect(next).toBeFocused();
  // Today is whatever the clock says; pin it to the week the example opens on.
  await page.clock.setFixedTime(new Date(2026, 10, 12, 10));
  await calendar.getByRole('button', { name: 'วันนี้' }).click();
  await expect(title).toHaveText(opening ?? '');
});

test('search narrows the events to the documents that hold the item', async ({ page }) => {
  await page.getByPlaceholder(/ค้นหา/).first().fill('iPhone');
  const events = page.locator('.spg-cal-col .spg-cal-event');
  await expect(events).toHaveCount(1);
  await expect(events.first()).toContainText('OS26-F00125');
});

test('a click on an event opens its details, and Enter does too', async ({ page }) => {
  await page.getByText('OS26-F00122 · 3 รายการ').click();
  await expect(page.locator('#log')).toHaveText('เปิดนัดหมาย: OS26-F00122 · 3 รายการ');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('OS26-F00122');
  await expect(dialog).toContainText('เบิกออกจาก Storage');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.locator('.spg-cal-event').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the calendar fits a phone screen without sideways page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/calendar.html');
  await expect(page.locator('.spg-cal')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
