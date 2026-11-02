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
    await dialog.locator('select[data-choice="gridLines"]').selectOption({ label });
    await dialog.locator('.dg-modal-ok').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await lines(page), mode).toEqual(expected);
  }

  // The last choice ('none') comes back after a reload.
  await page.reload();
  expect(await lines(page)).toEqual({ row: false, column: false, header: false });
});

test('the Settings modal picks the line style, which is drawn and remembered', async ({ page }) => {
  await page.goto('/examples/index.html');
  const rowLine = () =>
    page
      .locator('tbody tr:nth-child(2) td:nth-child(3)')
      .evaluate((td) => getComputedStyle(td).borderBottomStyle);
  expect(await rowLine()).toBe('dashed'); // the theme's default

  for (const [label, style] of [
    ['เส้นทึบ', 'solid'],
    ['เส้นจุด', 'dotted'],
    ['เส้นประ', 'dashed'],
    ['เส้นทึบ', 'solid'],
  ]) {
    await page.locator('.dg-columns-btn').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('select[data-choice="lineStyle"]').selectOption({ label });
    await dialog.locator('.dg-modal-ok').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await rowLine(), style).toBe(style);
  }

  await page.reload();
  expect(await rowLine()).toBe('solid');

  // 'ค่าเริ่มต้น' goes back to the theme.
  await page.locator('.dg-columns-btn').click();
  await page.locator('select[data-choice="lineStyle"]').selectOption({ label: 'ค่าเริ่มต้น' });
  await page.locator('.dg-modal-ok').click();
  expect(await rowLine()).toBe('dashed');
});

test('the Settings modal has a round close button hanging off its top-right corner', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  await page.locator('.dg-columns-btn').click();
  const box = page.locator('.dg-settings');
  const close = box.getByRole('button', { name: 'ปิด' });
  await expect(close).toBeVisible();
  await expect(close).toHaveCSS('border-top-left-radius', '50%');
  await expect(close).toHaveCSS('cursor', 'pointer');
  await page.waitForTimeout(250); // the card's entrance animation
  const [b, c] = await Promise.all([box.boundingBox(), close.boundingBox()]);
  // The button's centre sits just outside the card's top-right corner.
  expect((c?.x ?? 0) + (c?.width ?? 0) / 2).toBeGreaterThan((b?.x ?? 0) + (b?.width ?? 0) - 6);
  expect((c?.y ?? 0) + (c?.height ?? 0) / 2).toBeLessThan((b?.y ?? 0) + 6);

  await close.click();
  await expect(page.locator('.dg-modal')).toHaveCount(0);
});
