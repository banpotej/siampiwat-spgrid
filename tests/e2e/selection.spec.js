import { expect, test } from '@playwright/test';

// tests/e2e/fixtures/selection.html: 12 rows (ids 1-12), pageSize 5, selectable, rows open on Enter / double-click.
test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/selection.html');
});

const rows = (/** @type {import('@playwright/test').Page} */ page) =>
  page.locator('tbody tr[data-row-index]');

test('the checkboxes select rows, the header box takes the page, and aria-selected follows', async ({
  page,
}) => {
  await expect(page.locator('thead input.spg-select-all')).toBeVisible();
  await rows(page).nth(1).locator('input.spg-select').check();
  await expect(rows(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(rows(page).nth(1)).toHaveClass(/is-selected/);
  await expect(page.locator('#log')).toHaveText('selected 2');

  await page.locator('thead input.spg-select-all').check();
  await expect(page.locator('tbody tr.is-selected')).toHaveCount(5);
  await page
    .getByRole('button', { name: /next|ถัดไป/i })
    .first()
    .click();
  await expect(page.locator('tbody tr.is-selected')).toHaveCount(0);
  await expect(page.locator('thead input.spg-select-all')).not.toBeChecked();
  expect(await page.evaluate(() => /** @type {any} */ (window).grid.getSelectedRows().length)).toBe(
    5,
  );
});

test('the rows are one Tab stop, arrow keys move between them and Space selects', async ({
  page,
}) => {
  await page.locator('thead input.spg-select-all').focus();
  await page.keyboard.press('Tab'); // the sortable ID header
  await page.keyboard.press('Tab'); // the sortable Name header
  await page.keyboard.press('Tab'); // one stop for all the rows
  await expect(rows(page).nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(rows(page).nth(2)).toBeFocused();
  await expect(rows(page).nth(2)).toHaveAttribute('tabindex', '0');
  await expect(rows(page).nth(0)).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('Space');
  await expect(rows(page).nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(rows(page).nth(2)).toBeFocused(); // focus survives the redraw
  await expect(page.locator('#log')).toHaveText('selected 3');

  await page.keyboard.press('End');
  await expect(rows(page).nth(4)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#log')).toHaveText('open 5');
  await page.keyboard.press('Home');
  await page.keyboard.press('Space');
  await expect(page.locator('#log')).toHaveText('selected 1,3');
});

test('a selected row is tinted, frozen cells too, and the checkbox column is frozen with the first column', async ({
  page,
}) => {
  await rows(page).nth(0).locator('input.spg-select').check();
  /** @param {number} row @param {number} cell @param {'backgroundColor' | 'backgroundImage'} property */
  const paint = (row, cell, property) =>
    rows(page)
      .nth(row)
      .locator('td')
      .nth(cell)
      .evaluate((td, name) => getComputedStyle(td)[name], property);
  // cell 2 (Name) scrolls; cells 0 and 1 (checkbox, ID) are frozen and paint the tint as an image over their solid colour
  expect(await paint(0, 2, 'backgroundColor')).not.toBe(await paint(1, 2, 'backgroundColor'));
  expect(await paint(0, 1, 'backgroundImage')).not.toBe(await paint(1, 1, 'backgroundImage'));
  await expect(page.locator('thead th.spg-frozen')).toHaveCount(2);
  await expect(page.locator('thead th.spg-select-col')).toHaveClass(/spg-frozen/);
});
