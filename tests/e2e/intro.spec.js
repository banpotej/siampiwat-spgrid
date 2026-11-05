import { expect, test } from '@playwright/test';

for (const [path, heading] of [['/purchase-order.html', 'Purchase Order']]) {
  test(`${heading}: the explanation starts hidden and can be shown and hidden`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);

    const items = page.locator('.intro li');
    await expect(items.first()).toBeHidden();

    await page.getByText('คำอธิบายตัวอย่าง').click();
    await expect(items.first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'การใช้งานในโค้ด' })).toBeVisible();
    await expect(page.locator('.intro pre code')).toContainText('new SPGrid(');

    await page.getByText('คำอธิบายตัวอย่าง').click();
    await expect(items.first()).toBeHidden();
  });
}
