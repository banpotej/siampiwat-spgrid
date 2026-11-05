import { expect, test } from '@playwright/test';

// tests/e2e/fixtures/actions.html: a few columns in a card much wider than their content, with View and Cancel columns.
test('an action column is no wider than its button plus the cell padding', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/actions.html');
  const widths = await page.evaluate(() => {
    const cell = /** @type {HTMLElement} */ (document.querySelector('tbody tr td.spg-action-cell'));
    const button = /** @type {HTMLElement} */ (cell.querySelector('button.spg-action'));
    const style = getComputedStyle(cell);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    return {
      cell: cell.getBoundingClientRect().width,
      button: button.getBoundingClientRect().width,
      padding,
    };
  });
  expect(widths.cell).toBeLessThanOrEqual(widths.button + widths.padding + 1);
});
