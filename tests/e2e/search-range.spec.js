import { expect, test } from '@playwright/test';

test('the date range boxes fit inside the filter bar and the frame shows the focus', async ({
  page,
}) => {
  await page.goto('/purchase-order.html');
  await page
    .getByRole('combobox', { name: 'ค้นหาใน' })
    .selectOption({ label: 'วันที่จัดส่งเอกสาร' });

  const range = page.locator('.dg-search-range');
  const from = page.locator('.dg-date-from');
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

  // The dates are borderless, so the range reads as one input group; only the shared frame shows focus.
  await expect(from).toHaveCSS('border-top-width', '0px');
  await expect(range).not.toHaveCSS('border-top-left-radius', '6px'); // square, like its neighbours
  await expect(range).toHaveCSS('outline-style', 'none');
  await from.focus();
  await expect(range).toHaveCSS('outline-style', 'solid');
  await expect(from).toHaveCSS('box-shadow', 'none');
});
