import { expect, test } from '@playwright/test';

// examples/index.html: plain-text cells until column.render exists (no buttons or log yet).
test('renders 10 rows, sorts by date, searches by vendor and scrolls horizontally', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(10);

  const dateHeader = page.getByRole('columnheader', { name: /Submitted Date/ });
  await dateHeader.click();
  await dateHeader.click();
  const dates = await rows.locator('td:nth-child(3)').allTextContents();
  expect(dates).toEqual([...dates].sort().reverse());

  await page.getByRole('searchbox').fill('พรีมาออฟฟิศ');
  // Poll: the filter runs after the search debounce, so the old rows are briefly still shown.
  await expect
    .poll(async () => {
      const vendors = await rows.locator('td:nth-child(6)').allTextContents();
      return vendors.length > 0 && vendors.every((v) => v.includes('พรีมาออฟฟิศ'));
    })
    .toBe(true);

  const overflows = await page
    .locator('.dg-table-wrap')
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflows).toBe(true);
});
