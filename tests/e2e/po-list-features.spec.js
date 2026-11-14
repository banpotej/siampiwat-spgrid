import { statSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// examples/purchase-order.html with the newer options: buttonLabels, clearFiltersButton, advancedFilterStorageKey and
// selectable with a "ส่งออกที่เลือก" action. The first column is the checkbox, so the data columns are td 2, 3, ...
test.beforeEach(async ({ page }) => {
  await page.goto('/purchase-order.html');
});

const rows = (/** @type {import('@playwright/test').Page} */ page) =>
  page.locator('tbody tr[data-row-index]');

test('every toolbar button shows its Thai name, and nothing is cut off or on top of another', async ({
  page,
}) => {
  const buttons = page
    .locator('.spg-tool-btn, .spg-export, .spg-search-submit, .spg-search-reset')
    .filter({ visible: true });
  const shown = await buttons.evaluateAll((list) =>
    list.map((b) => [b.getAttribute('aria-label'), getComputedStyle(b, '::after').content]),
  );
  expect(shown.map(([name]) => name)).toEqual([
    'ค้นหา',
    'ล้างเฉพาะคำค้นหา',
    'โหลดข้อมูลใหม่',
    'ตัวกรองขั้นสูง',
    'ส่งออก Excel',
    'ตั้งค่า',
  ]);
  for (const [name, content] of shown) expect(content).toBe(`"${name}"`);

  const boxes = /** @type {{ x: number, y: number, width: number, height: number }[]} */ (
    await Promise.all((await buttons.all()).map((b) => b.boundingBox()))
  );
  const group = /** @type {{ x: number, width: number }} */ (
    await page.locator('.spg-input-group').boundingBox()
  );
  for (const [i, a] of boxes.entries()) {
    expect(a.x + a.width).toBeLessThanOrEqual(group.x + group.width + 1);
    for (const b of boxes.slice(i + 1)) {
      const apart =
        a.x + a.width <= b.x + 1 ||
        b.x + b.width <= a.x + 1 ||
        a.y + a.height <= b.y + 1 ||
        b.y + b.height <= a.y + 1;
      expect(apart).toBe(true);
    }
  }
  expect((await page.locator('.spg-search').boundingBox())?.width ?? 0).toBeGreaterThan(150);
});

test('ticking rows opens the bar, and its export holds only the ticked rows', async ({ page }) => {
  const bar = page.locator('.spg-selection-bar');
  await expect(bar).toBeHidden();
  await expect(page.locator('thead input.spg-select-all')).toBeVisible();

  await rows(page).nth(0).locator('input.spg-select').check();
  await rows(page).nth(2).locator('input.spg-select').check();
  await expect(bar).toBeVisible();
  await expect(bar.locator('.spg-sel-count')).toHaveText('เลือกแล้ว 2 รายการ');

  const some = page.waitForEvent('download');
  await bar.getByRole('button', { name: 'ส่งออกที่เลือก' }).click();
  const selected = await some;
  expect(selected.suggestedFilename()).toMatch(/^purchase-orders-\d{4}-\d{2}-\d{2}\.xlsx$/);

  // The whole page's export (no selection needed) is bigger than the two-row one.
  await bar.getByRole('button', { name: 'ล้างการเลือก' }).click();
  await expect(bar).toBeHidden();
  const all = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ส่งออก Excel' }).click();
  await page.locator('.spg-modal-ok').click();
  const full = await all;
  expect(statSync(/** @type {string} */ (await selected.path())).size).toBeLessThan(
    statSync(/** @type {string} */ (await full.path())).size,
  );

  // The header checkbox takes the 10 rows of the page, with its half state in between.
  await page.locator('thead input.spg-select-all').check();
  await expect(bar.locator('.spg-sel-count')).toHaveText('เลือกแล้ว 10 รายการ');
  await rows(page).nth(0).locator('input.spg-select').uncheck();
  expect(
    await page
      .locator('thead input.spg-select-all')
      .evaluate((box) => /** @type {HTMLInputElement} */ (box).indeterminate),
  ).toBe(true);
});

test('the row buttons and the details still work with the checkbox column in front', async ({
  page,
}) => {
  const row = rows(page).nth(2);
  const po = (await row.locator('td:nth-child(4)').textContent())?.trim();
  await row.getByRole('button', { name: 'ดู', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(po ?? '');
  await page.keyboard.press('Escape');
  // The eye button reports the View column, not its neighbour (the checkbox cell must not shift the columns).
  await expect(row.locator('input.spg-select')).not.toBeChecked();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the clear-filters button shows with a filter and clears the search and the advanced filter together', async ({
  page,
}) => {
  const clear = page.getByRole('button', { name: 'ล้างทั้งหมด (คำค้นหาและตัวกรอง)' });
  await expect(clear).toBeHidden();
  await page.locator('.spg-search').fill('ลานนา');
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  await expect(clear).toBeVisible();

  await page.getByRole('button', { name: 'ตัวกรองขั้นสูง' }).click();
  const dialog = page.getByRole('dialog', { name: 'ตัวกรองขั้นสูง' });
  const first = dialog.locator('.spg-adv-row').first();
  await first.locator('.spg-adv-field').selectOption('description');
  await first.locator('.spg-adv-input').fill('ค่า');
  await dialog.getByRole('button', { name: 'ตกลง' }).click();
  await expect(page.locator('.spg-chip-text')).not.toHaveCount(0);

  await clear.click();
  await expect(clear).toBeHidden();
  await expect(page.locator('.spg-search')).toHaveValue('');
  await expect(page.locator('.spg-chip-text')).toHaveCount(0);
  await expect(rows(page)).toHaveCount(10);
});

test('the advanced filter is remembered across a reload (advancedFilterStorageKey)', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'ตัวกรองขั้นสูง' }).click();
  const dialog = page.getByRole('dialog', { name: 'ตัวกรองขั้นสูง' });
  const first = dialog.locator('.spg-adv-row').first();
  await first.locator('.spg-adv-field').selectOption('vendor');
  await first.locator('.spg-adv-input').fill('ลานนา');
  await dialog.getByRole('button', { name: 'ตกลง' }).click();
  await expect(page.locator('.spg-chip-text')).toHaveCount(1);
  expect(
    await page.evaluate(() => localStorage.getItem('spgrid:advancedFilter:purchase-orders')),
  ).toContain('ลานนา');

  await page.reload();
  await expect(page.locator('.spg-chip-text')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'ตัวกรองขั้นสูง' })).toHaveAttribute(
    'data-active',
    '',
  );
  const vendors = await rows(page).locator('td:nth-child(9)').allTextContents();
  expect(vendors.length).toBeGreaterThan(0);
  for (const vendor of vendors) expect(vendor).toContain('ลานนา');

  // Clearing it is remembered too.
  await page.getByRole('button', { name: /ลบตัวกรอง/ }).click();
  await page.reload();
  await expect(page.locator('.spg-chip-text')).toHaveCount(0);
});

test('the row buttons say what they do in Thai, with the main action and the destructive one told apart', async ({
  page,
}) => {
  await expect(page.locator('th.spg-action-col')).toHaveText('การดำเนินการ');
  const view = rows(page).first().getByRole('button', { name: 'ดู', exact: true });
  await expect(view).toHaveText('ดู');
  await expect(view).toHaveAttribute('title', 'ดูรายละเอียดใบสั่งซื้อ');
  await expect(view.locator('svg')).toBeVisible();

  const cancel = page.getByRole('button', { name: 'ยกเลิก', exact: true }).first();
  await expect(cancel).toHaveText('ยกเลิก');
  await expect(cancel.locator('svg')).toBeVisible();
  const color = (/** @type {import('@playwright/test').Locator} */ button) =>
    button.evaluate((el) => getComputedStyle(el).color);
  expect(await color(view)).not.toBe(await color(cancel)); // accent blue vs. danger red
  expect(await color(cancel)).toMatch(/^rgb\((1[5-9]\d|2\d\d), \d{1,2}, \d{1,2}\)$/); // a red

  // Same width in every row (the cell is as wide as its widest), and the buttons are tall enough to hit.
  const widths = await page
    .locator('td.spg-action-cell')
    .evaluateAll((cells) => cells.map((c) => Math.round(c.getBoundingClientRect().width)));
  expect(new Set(widths).size).toBe(1);
  expect((await view.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(24);
});
