import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page @param {string} count */
async function freeze(page, count) {
  await page.locator('.dg-columns-btn').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('select[data-choice="freezeColumns"]').selectOption(count);
  await dialog.locator('.dg-modal-ok').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Left edge of the first two header cells, and of the third (which is not frozen). */
const edges = (/** @type {import('@playwright/test').Page} */ page) =>
  page.evaluate(() => {
    const left = (/** @type {number} */ n) =>
      Math.round(
        document.querySelector(`thead th:nth-child(${n})`)?.getBoundingClientRect().left ?? 0,
      );
    return { first: left(1), second: left(2), third: left(3) };
  });

test('the Settings modal freezes the first columns, which stay put while the table scrolls sideways', async ({
  page,
}) => {
  await page.goto('/purchase-order.html');
  const wrap = page.locator('#grid .dg-table-wrap');
  await expect(page.locator('.dg-frozen')).toHaveCount(0);

  await freeze(page, '2');
  await expect(page.locator('thead th.dg-frozen')).toHaveCount(2);
  const before = await edges(page);
  await wrap.evaluate((el) => (el.scrollLeft = 400));
  const after = await edges(page);
  expect(after.first).toBe(before.first);
  expect(after.second).toBe(before.second);
  expect(after.third).toBeLessThan(before.third); // the rest slid under the frozen columns

  // A body cell sticks with its header, and the frozen cell covers what slides under it.
  const aligned = await page.evaluate(() => {
    const left = (/** @type {string} */ sel) =>
      Math.round(document.querySelector(sel)?.getBoundingClientRect().left ?? -1);
    return [1, 2].map(
      (n) => left(`thead th:nth-child(${n})`) === left(`tbody tr td:nth-child(${n})`),
    );
  });
  expect(aligned).toEqual([true, true]);
  const bg = await page
    .locator('tbody tr:nth-child(2) td.dg-frozen')
    .first()
    .evaluate((td) => getComputedStyle(td).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');

  // The choice comes back after a reload, and 'ไม่ตรึง' (none) takes it away.
  await page.reload();
  await expect(page.locator('thead th.dg-frozen')).toHaveCount(2);
  await freeze(page, '0');
  await expect(page.locator('.dg-frozen')).toHaveCount(0);
});
