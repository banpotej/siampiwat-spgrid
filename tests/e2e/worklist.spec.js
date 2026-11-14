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

test('the worklist rows can be selected with the checkboxes and with Space, across the groups', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  const rows = page.locator('tbody tr[data-row-index]');
  await expect(page.locator('thead input.spg-select-all')).toBeAttached();
  await rows.nth(0).locator('input.spg-select').check();
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true');
  await rows.nth(2).focus();
  await page.keyboard.press('Space');
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(rows.nth(2)).toBeFocused();
  expect(await page.evaluate(() => document.querySelectorAll('tr.is-selected').length)).toBe(2);
  // This example hides its header row (it stays for screen readers), so the select-all box is clicked in the DOM.
  const all = page.locator('thead input.spg-select-all');
  await all.evaluate((box) => /** @type {HTMLInputElement} */ (box).click());
  await expect(page.locator('tr.is-selected')).toHaveCount(5);
  await all.evaluate((box) => /** @type {HTMLInputElement} */ (box).click());
  await expect(page.locator('tr.is-selected')).toHaveCount(0);
});

test('with buttonLabels every toolbar button shows its Thai name and the group wraps instead of squeezing', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  const buttons = page
    .locator('.spg-tool-btn, .spg-export, .spg-search-submit, .spg-search-reset')
    .filter({ visible: true }); // the clear-filters button hides until something filters the rows
  const shown = await buttons.evaluateAll((list) =>
    list.map((b) => [b.getAttribute('aria-label'), getComputedStyle(b, '::after').content]),
  );
  expect(shown.length).toBe(8);
  for (const [name, content] of shown) expect(content).toBe(`"${name}"`);
  expect(shown.map(([name]) => name)).toContain('โหลดข้อมูลใหม่');
  // No button is cut off or on top of another, and the search box keeps a usable width.
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
  const search = await page.locator('.spg-search').boundingBox();
  expect(search?.width ?? 0).toBeGreaterThan(150);
});

test('the selection bar counts the selected items and approves them after a question', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  const bar = page.locator('.spg-selection-bar');
  const rows = page.locator('tbody tr[data-row-index]');
  // The header row is not drawn, so the bar is there from the start with its own select-all box.
  await expect(bar).toBeVisible();
  await expect(bar.getByText('เลือกทั้งหมดในหน้านี้')).toBeVisible();
  await expect(bar.locator('.spg-sel-actions')).toBeHidden();

  await rows.nth(0).locator('input.spg-select').check();
  await rows.nth(1).locator('input.spg-select').check();
  await expect(bar.locator('.spg-sel-count')).toHaveText('เลือกแล้ว 2 รายการ');
  await expect(bar.getByRole('button', { name: 'อนุมัติ' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'ส่งกลับ' })).toBeVisible();

  // Approve asks first: No keeps the selection and does nothing.
  await bar.getByRole('button', { name: 'อนุมัติ' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('ต้องการอนุมัติ 2 รายการใช่หรือไม่?');
  await dialog.getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#log')).not.toContainText('approve');
  await expect(bar.locator('.spg-sel-count')).toHaveText('เลือกแล้ว 2 รายการ');

  await bar.getByRole('button', { name: 'อนุมัติ' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'อนุมัติ' }).click();
  await expect(page.locator('#log')).toHaveText('approve: OS26-F00122-01, OS26-F00122-02');

  // Return has no question; Clear selection empties the bar's actions again.
  await bar.getByRole('button', { name: 'ส่งกลับ' }).click();
  await expect(page.locator('#log')).toHaveText('return: OS26-F00122-01, OS26-F00122-02');
  await bar.getByRole('button', { name: 'ล้างการเลือก' }).click();
  await expect(bar.locator('.spg-sel-actions')).toBeHidden();
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'false');

  // The select-all box takes the page and shows a half state for a part of it.
  const all = bar.locator('input.spg-bar-all');
  await all.check();
  await expect(bar.locator('.spg-sel-count')).toHaveText('เลือกแล้ว 5 รายการ');
  await rows.nth(0).locator('input.spg-select').uncheck();
  expect(await all.evaluate((box) => /** @type {HTMLInputElement} */ (box).indeterminate)).toBe(
    true,
  );
});

test('the clear-filters button appears with a search and clears the search and the filters together', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  const clear = page.getByRole('button', { name: 'ล้างทั้งหมด (คำค้นหาและตัวกรอง)' });
  await expect(clear).toBeHidden();
  await page.locator('.spg-search').fill('กระเป๋า');
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  await expect(clear).toBeVisible();
  expect(await page.locator('tbody tr[data-row-index]').count()).toBeLessThan(6);
  await clear.click();
  await expect(clear).toBeHidden();
  await expect(page.locator('.spg-search')).toHaveValue('');
  await expect(page.locator('.spg-count')).toHaveText('6 รายการ');
});

test('an item shows who asked, the unit, how long it waited, and an overdue mark when it is late', async ({
  page,
}) => {
  await page.goto('/worklist.html');
  const first = page.locator('tbody tr[data-row-index] .task').first();
  await expect(first.locator('.task-who')).toHaveText('ผู้ขอ: สมชาย ใจดี');
  await expect(first.locator('.task-dept')).toHaveText('หน่วยงาน: จัดซื้อ');
  await expect(first.locator('.task-wait')).toHaveText('รอมาแล้ว 2 ชม.');
  await expect(first.locator('.task-overdue')).toHaveCount(0);
  // Items asked for yesterday are overdue (red).
  const late = page.locator('.task-overdue').first();
  await expect(late).toHaveText('เกินกำหนด');
  expect(await late.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(180, 35, 24)');
});

test('each card ends with a details button; the checkbox only selects', async ({ page }) => {
  await page.goto('/worklist.html');
  const rows = page.locator('tbody tr[data-row-index]');
  const button = rows.nth(1).locator('.task-detail');
  await expect(page.locator('.task-detail')).toHaveCount(5);
  await expect(button).toHaveText('ดูรายละเอียด');
  await expect(button).toHaveAccessibleName('ดูรายละเอียด OS26-F00122-02');

  // Same place and shape on every card: at the end (right) of the card, and 44px high or more to tap.
  const boxes = await page.locator('.task-detail').evaluateAll((list) =>
    list.map((b) => {
      const card = /** @type {HTMLElement} */ (b.closest('.task')).getBoundingClientRect();
      const r = b.getBoundingClientRect();
      return { height: r.height, gap: Math.round(card.right - r.right) };
    }),
  );
  for (const { height, gap } of boxes) {
    expect(height).toBeGreaterThanOrEqual(44);
    expect(gap).toBeLessThanOrEqual(24);
  }

  // The checkbox selects and opens nothing.
  await rows.nth(1).locator('input.spg-select').check();
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#log')).not.toContainText('เปิดรายการ');

  // The button opens that card's details (and does not select it).
  await rows.nth(2).locator('.task-detail').click();
  await expect(page.locator('#log')).toHaveText('เปิดรายการ: OS26-F00122-03');
  await expect(page.getByRole('dialog')).toContainText('OS26-F00122-03');
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // From the keyboard: Tab reaches the button and Enter opens the details.
  await rows.nth(0).focus();
  await rows.nth(0).locator('.task-detail').focus();
  await expect(rows.nth(0).locator('.task-detail')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#log')).toHaveText('เปิดรายการ: OS26-F00122-01');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the worklist never scrolls sideways, even on a phone-width screen', async ({ page }) => {
  for (const width of [1280, 600, 420, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/worklist.html');
    await expect(page.locator('tbody tr[data-row-index]').first()).toBeVisible();
    const [client, scroll] = await page
      .locator('.spg-table-wrap')
      .evaluate((el) => [el.clientWidth, el.scrollWidth]);
    expect(scroll, `table wider than its frame at ${width}px`).toBeLessThanOrEqual(client);
    // The details button is whole inside its card, and the card inside the frame.
    const inside = await page
      .locator('.task-detail')
      .first()
      .evaluate((b) => {
        const card = /** @type {HTMLElement} */ (b.closest('.task')).getBoundingClientRect();
        const wrap = /** @type {HTMLElement} */ (
          b.closest('.spg-table-wrap')
        ).getBoundingClientRect();
        const r = b.getBoundingClientRect();
        return r.right <= card.right + 1 && card.right <= wrap.right + 1;
      });
    expect(inside).toBe(true);
  }
});
