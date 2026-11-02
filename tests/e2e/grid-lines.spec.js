import { expect, test } from '@playwright/test';

/** Which of a body cell's lines are drawn, and the header's line under it. */
const MODES = [
  { mode: 'default', label: 'ค่าเริ่มต้น', row: true, column: false, header: true },
  { mode: 'horizontal', label: 'แนวนอน', row: true, column: false, header: true },
  { mode: 'vertical', label: 'แนวตั้ง', row: false, column: true, header: false },
  { mode: 'both', label: 'ทั้งสองแนว', row: true, column: true, header: true },
  { mode: 'none', label: 'ไม่แสดง', row: false, column: false, header: false },
];

/** @param {import('@playwright/test').Page} page */
async function lines(page) {
  return page.evaluate(() => {
    const width = (/** @type {Element} */ el, /** @type {string} */ side) =>
      parseFloat(getComputedStyle(el)[/** @type {any} */ (side)]);
    const td = /** @type {Element} */ (
      document.querySelector('tbody tr:nth-child(2) td:nth-child(3)')
    );
    const th = /** @type {Element} */ (document.querySelector('thead th:nth-child(3)'));
    return {
      row: width(td, 'borderBottomWidth') > 0,
      column: width(td, 'borderInlineEndWidth') > 0,
      header: width(th, 'borderBottomWidth') > 0,
    };
  });
}

test('the Settings modal picks the grid lines, which are drawn and remembered', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  expect(await lines(page)).toEqual({ row: true, column: true, header: true }); // the example starts with 'both'

  for (const { mode, label, ...expected } of MODES) {
    await page.locator('.dg-columns-btn').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('เส้นตาราง').selectOption({ label });
    await dialog.locator('.dg-modal-ok').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await lines(page), mode).toEqual(expected);
  }

  // The last choice ('none') comes back after a reload.
  await page.reload();
  expect(await lines(page)).toEqual({ row: false, column: false, header: false });
});
