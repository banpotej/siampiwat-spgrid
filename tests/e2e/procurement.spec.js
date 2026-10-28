import { expect, test } from '@playwright/test';

// examples/index.html: View/Cancel action columns (cells are plain text; no column.render yet).
// Columns: 1 View, 2 Cancel, 3 RFQ, 4 PO, 5 Submitted, 6 Type, 7 Status, 8 Vendor, ...
test('renders 10 rows, sorts by date, searches by vendor and scrolls horizontally', async ({
  page,
}) => {
  await page.goto('/examples/index.html');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(10);

  const dateHeader = page.getByRole('columnheader', { name: /Submitted Date/ });
  await dateHeader.click();
  await dateHeader.click();
  const dates = await rows.locator('td:nth-child(5)').allTextContents();
  expect(dates).toEqual([...dates].sort().reverse());

  await page.getByRole('searchbox').fill('พรีมาออฟฟิศ');
  // Poll: the filter runs after the search debounce, so the old rows are briefly still shown.
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
    const noRfq = ((await row.locator('td:nth-child(3)').textContent()) ?? '').trim() === '';
    await expect(row.getByRole('button', { name: 'Cancel' })).toHaveCount(
      completed && noRfq ? 1 : 0,
    );
  }

  // After sorting and paging, the button still belongs to the row it is on.
  await page.getByRole('columnheader', { name: /PO Number/ }).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  const third = rows.nth(2);
  const po = await third.locator('td:nth-child(4)').textContent();
  await third.getByRole('button', { name: 'View' }).click();
  await expect(log).toHaveText(`view ${po}`);

  page.once('dialog', (dialog) => dialog.accept());
  const cancel = page.getByRole('button', { name: 'Cancel' }).first();
  const cancelPo = await cancel.locator('xpath=ancestor::tr/td[4]').textContent();
  await cancel.click();
  await expect(log).toHaveText(`cancel ${cancelPo}`);
});
