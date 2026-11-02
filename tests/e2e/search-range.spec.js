import { expect, test } from '@playwright/test';

test('the date range boxes fit inside the filter bar and light up when focused', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  await page
    .getByRole('combobox', { name: 'ค้นหาใน' })
    .selectOption({ label: 'วันที่จัดส่งเอกสาร' });

  const range = page.locator('.dg-search-range');
  const from = page.locator('.dg-date-from');
  const to = page.locator('.dg-date-to');
  await expect(range).toBeVisible();

  const fits = await range.evaluate((el) => {
    const frame = el.getBoundingClientRect();
    const inside = (/** @type {Element} */ box) => {
      const r = box.getBoundingClientRect();
      return r.left >= frame.left && r.right <= frame.right && r.width > 0;
    };
    return [...el.querySelectorAll('input')].every(inside) && el.scrollWidth <= el.clientWidth;
  });
  expect(fits).toBe(true);

  const restBg = await from.evaluate((el) => getComputedStyle(el).backgroundColor);
  await from.focus();
  await expect(from).not.toHaveCSS('background-color', restBg); // retries through the 120ms transition
  await expect(to).toHaveCSS('background-color', restBg);
});
