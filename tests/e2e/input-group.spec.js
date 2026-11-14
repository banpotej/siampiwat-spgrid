import { expect, test } from '@playwright/test';

// tests/e2e/fixtures/input-group.html: the filter bar in its default (icon-only) look; the PO example has `buttonLabels` on.
/** Search columns of the fixture, one per kind of search box the group can show. */
const KINDS = [
  { name: 'text', label: null },
  { name: 'enum', label: 'สถานะ' },
  { name: 'date', label: 'วันที่จัดส่งเอกสาร' },
];

for (const { name, label } of KINDS) {
  test(`the filter bar is one input group with a ${name} search box`, async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/input-group.html');
    if (label) {
      await page.getByRole('combobox', { name: 'ค้นหาใน' }).selectOption({ label });
    }

    // Every visible part of the group (a field holds the search box, value select or date range) is as tall as the rest.
    const parts = await page.locator('.spg-input-group').evaluate((group) => {
      const visible = (/** @type {Element} */ el) => el.getClientRects().length > 0;
      return [...group.children].filter(visible).map((child) => {
        const box = [...child.querySelectorAll('.spg-search, .spg-search-value, .spg-search-range')]
          .filter(visible)
          .at(0);
        const target = box ?? child;
        const { height, top } = target.getBoundingClientRect();
        return { height: Math.round(height * 10) / 10, top: Math.round(top * 10) / 10 };
      });
    });
    expect(parts.length).toBeGreaterThan(3);
    for (const part of parts) expect(part).toEqual(parts[0]);

    // Only the outer corners of the group are round: the middle part (search box, value select or range) is square.
    const middle = page
      .locator('.spg-search:visible, .spg-search-value:visible, .spg-search-range:visible')
      .first();
    await expect(middle).toHaveCSS('border-top-left-radius', '0px');
    await expect(middle).toHaveCSS('border-top-right-radius', '0px');
  });
}

test('the column select keeps the neutral tone when a column is chosen', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/input-group.html');
  const select = page.getByRole('combobox', { name: 'ค้นหาใน' });
  const rest = await select.evaluate((el) => getComputedStyle(el).backgroundColor);
  await select.selectOption({ label: 'สถานะ' });
  await expect(select).toHaveCSS('background-color', rest);
});
