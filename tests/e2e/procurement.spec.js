import { expect, test } from '@playwright/test';

// examples/index.html: one action column with View and Cancel (cells are plain text; no column.render yet).
// Columns: 1 Actions, 2 RFQ, 3 PO, 4 Description, 5 Submitted, 6 Type, 7 Status, 8 Vendor, ...
test('renders 10 rows, sorts by date, searches by vendor and scrolls horizontally', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(10);

  const dateHeader = page.getByRole('columnheader', { name: /วันที่จัดส่งเอกสาร/ });
  // The example starts sorted by this column, so cycle until it is descending.
  for (let i = 0; i < 3 && (await dateHeader.getAttribute('aria-sort')) !== 'descending'; i++) {
    await dateHeader.click();
  }
  await expect(dateHeader).toHaveAttribute('aria-sort', 'descending');
  const dates = (await rows.locator('td:nth-child(5)').allTextContents()).map((d) => Date.parse(d));
  expect(dates).toEqual([...dates].sort((a, b) => b - a));

  const search = page.getByRole('searchbox');
  await search.fill('พรีมาออฟฟิศ');
  // The page has a Search button: typing alone must not filter.
  await page.waitForTimeout(400);
  await expect(rows).toHaveCount(10);
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  // Poll: rows are re-rendered synchronously, but keep the assertion robust against timing.
  await expect
    .poll(async () => {
      const vendors = await rows.locator('td:nth-child(8)').allTextContents();
      return vendors.length > 0 && vendors.every((v) => v.includes('พรีมาออฟฟิศ'));
    })
    .toBe(true);

  const overflows = await page
    .locator('.dg-table-wrap')
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflows).toBe(true);
});

test('View and Cancel report the clicked row; Cancel only where allowed', async ({ page }) => {
  await page.goto('/examples/index.html');
  const rows = page.locator('tbody tr');
  const log = page.locator('#log');

  // Cancel is offered exactly for completed orders without an RFQ number.
  for (let i = 0; i < (await rows.count()); i++) {
    const row = rows.nth(i);
    const completed = (await row.locator('td:nth-child(7)').textContent()) === 'เสร็จสิ้น';
    const noRfq = ((await row.locator('td:nth-child(2)').textContent()) ?? '').trim() === '';
    await expect(row.getByRole('button', { name: 'Cancel' })).toHaveCount(
      completed && noRfq ? 1 : 0,
    );
  }

  // After sorting and paging, the button still belongs to the row it is on.
  await page.getByRole('columnheader', { name: /เลขที่ใบสั่งซื้อ/ }).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  const third = rows.nth(2);
  const po = await third.locator('td:nth-child(3)').textContent();
  await third.getByRole('button', { name: 'View' }).click();
  await expect(page.locator('.dg-modal')).toContainText(po?.trim() ?? '');
  await expect(log).toHaveText('');
  await page.keyboard.press('Escape');

  const cancel = page.getByRole('button', { name: 'Cancel' }).first();
  const cancelPo = await cancel.locator('xpath=ancestor::tr/td[3]').textContent();
  await cancel.click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText(cancelPo?.trim() ?? '');
  await confirm.getByRole('button', { name: 'ไม่ยกเลิก' }).click(); // the safe answer changes nothing
  await expect(log).toHaveText('');
  await cancel.click();
  await confirm.getByRole('button', { name: 'ยกเลิกเอกสาร' }).click();
  await expect(log).toHaveText(`cancel ${cancelPo}`);
});

test('Enter in the search box also searches (Search button mode)', async ({ page }) => {
  await page.goto('/examples/index.html');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(10);
  await page.getByRole('searchbox').fill('พรีมาออฟฟิศ');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => {
      const vendors = await rows.locator('td:nth-child(8)').allTextContents();
      return vendors.length > 0 && vendors.every((v) => v.includes('พรีมาออฟฟิศ'));
    })
    .toBe(true);
  await expect(page.getByRole('searchbox')).toBeFocused();
});

test('Clear search button empties the box and restores all rows', async ({ page }) => {
  await page.goto('/examples/index.html');
  const rows = page.locator('tbody tr');
  const search = page.getByRole('searchbox');
  await search.fill('พรีมาออฟฟิศ');
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  await expect
    .poll(async () => {
      const vendors = await rows.locator('td:nth-child(8)').allTextContents();
      return vendors.length > 0 && vendors.every((v) => v.includes('พรีมาออฟฟิศ'));
    })
    .toBe(true);
  const filteredCount = await rows.count();

  await page.getByRole('button', { name: 'ล้างการค้นหา' }).last().click();
  await expect
    .poll(async () =>
      (await rows.locator('td:nth-child(8)').allTextContents()).some(
        (v) => !v.includes('พรีมาออฟฟิศ'),
      ),
    )
    .toBe(true);
  expect(filteredCount).toBeGreaterThan(0);
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
});

test('View opens a modal with the clicked row, closed by the button, Esc or the backdrop', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  const row = page.locator('tbody tr').nth(2);
  const po = (await row.locator('td:nth-child(3)').textContent())?.trim();
  const modal = page.locator('.dg-modal');

  await row.getByRole('button', { name: 'View' }).click();
  await expect(modal.getByRole('dialog')).toContainText(po ?? '');
  await expect(modal.locator('.details-head .dg-badge')).toBeVisible(); // the status sits in the header
  for (const name of ['รายละเอียด', 'ชื่อผู้ค้า']) {
    await expect(modal.locator('dt', { hasText: name })).toHaveCount(1);
  }
  await expect(modal.locator('dd').first()).toBeVisible();

  await modal.getByRole('button', { name: 'ปิด' }).click();
  await expect(modal).toHaveCount(0);

  await row.getByRole('button', { name: 'View' }).click();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  await row.getByRole('button', { name: 'View' }).click();
  await modal.click({ position: { x: 5, y: 5 } });
  await expect(modal).toHaveCount(0);
});

test('dragging a header edge resizes only that column', async ({ page }) => {
  await page.goto('/examples/index.html');
  const header = page.getByRole('columnheader', { name: /รายละเอียด/ });
  const width = async () => (await header.boundingBox())?.width ?? 0;
  const before = await width();
  const next = page.getByRole('columnheader', { name: /วันที่จัดส่งเอกสาร/ });
  const nextBefore = (await next.boundingBox())?.width ?? 0;

  const handle = header.getByRole('separator');
  const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (
    await handle.boundingBox()
  );
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y, { steps: 5 });
  await page.mouse.up();

  expect(Math.abs((await width()) - (before + 80))).toBeLessThanOrEqual(2);
  expect(Math.abs(((await next.boundingBox())?.width ?? 0) - nextBefore)).toBeLessThanOrEqual(2);
  // a drag is not a click on the sortable header
  await expect(header).not.toHaveAttribute('aria-sort', /.+/);

  // survives a re-render: sort another column
  await page.getByRole('columnheader', { name: /เลขที่ใบสั่งซื้อ/ }).click();
  expect(Math.abs((await width()) - (before + 80))).toBeLessThanOrEqual(2);
});

test('a narrowed column clips its text instead of covering the next cell', async ({ page }) => {
  await page.goto('/examples/index.html');
  const header = page.getByRole('columnheader', { name: /รายละเอียด/ });
  const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (
    await header.getByRole('separator').boundingBox()
  );
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 200, y, { steps: 5 });
  await page.mouse.up();

  const overlaps = await page.evaluate(() => {
    const index = [...document.querySelectorAll('th')].findIndex((th) =>
      th.textContent?.includes('รายละเอียด'),
    );
    const cell = document.querySelector(`tbody tr td:nth-child(${index + 1})`);
    const next = cell?.nextElementSibling;
    if (!cell || !next) return null;
    const range = document.createRange();
    range.selectNodeContents(cell);
    const cellBox = cell.getBoundingClientRect();
    // text is painted only inside the cell's own box
    return (
      getComputedStyle(cell).overflow !== 'hidden' &&
      range.getBoundingClientRect().right > cellBox.right
    );
  });
  expect(overlaps).toBe(false);
});

test('dragging a header onto another reorders the columns and the order survives a reload', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  await page.evaluate(() => localStorage.removeItem('datagrid:columnOrder:purchase-orders'));
  await page.reload();
  const labels = async () =>
    (await page.locator('thead th').allInnerTexts()).map((t) => t.trim().split('\n')[0]);
  const before = await labels();
  expect(before.length).toBeGreaterThan(3);

  // drop the third column onto the left half of the first one
  const last = page.locator('thead th[data-key]').nth(2);
  const first = page.locator('thead th[data-key]').first();
  const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (
    await first.boundingBox()
  );
  await last.dragTo(first, { targetPosition: { x: 4, y: box.height / 2 } });

  const after = await labels();
  expect(after[0]).toBe(before[2]);
  expect(after[1]).toBe(before[0]);

  await page.reload();
  expect(await labels()).toEqual(after);
});

test('the details modal keeps Tab inside and gives focus back to the View button', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  const view = page.locator('tbody tr').first().getByRole('button', { name: 'View' });
  await view.click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('button', { name: 'ปิด' })).toBeFocused();
  for (const key of ['Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await modal.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(view).toBeFocused();
});

test('a row opens its details on double-click or Enter, and looks clickable', async ({ page }) => {
  await page.goto('/examples/index.html');
  const row = page.locator('tbody tr').nth(1);
  const po = (await row.locator('td:nth-child(3)').textContent())?.trim() ?? '';
  await expect(row).toHaveCSS('cursor', 'pointer');

  await row.locator('td:nth-child(3)').dblclick();
  await expect(page.getByRole('dialog')).toContainText(po);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await row.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText(po);
  await page.keyboard.press('Escape');
  await expect(row).toBeFocused(); // focus went back to where it was

  // A double-click on a button is left to the button: no second modal opens on top of the one it opened.
  await row.getByRole('button', { name: 'View' }).dispatchEvent('dblclick');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
