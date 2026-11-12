import { expect, test } from '@playwright/test';

const PAGES = ['purchase-order', 'theme-lavender', 'worklist', 'calendar', 'view-settings'];

for (const name of PAGES) {
  test(`${name}: the Claude Code prompt starts hidden and shows when opened`, async ({ page }) => {
    await page.goto(`/${name}.html`);
    const details = page.locator('#prompt details');
    const copy = page.locator('#prompt button');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(copy).toBeHidden();

    await page.getByRole('heading', { name: 'Prompt สำหรับ Claude Code' }).click();
    await expect(details).toHaveAttribute('open', '');
    await expect(copy).toBeVisible();
    await expect(page.locator('#prompt code')).toContainText('@siampiwat/spgrid');
    await expect(page.locator('#prompt code')).toContainText('AGENT_GUIDE.md');
  });
}

test('the prompt of the lavender page names its theme class', async ({ page }) => {
  await page.goto('/theme-lavender.html');
  await expect(page.locator('#prompt code')).toContainText('spg-theme-lavender');
});

test('the copy button copies the whole prompt', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/worklist.html');
  await page.getByRole('heading', { name: 'Prompt สำหรับ Claude Code' }).click();
  await page.locator('#prompt button').click();
  await expect(page.locator('#prompt button')).toHaveText('คัดลอกแล้ว');
  // The Windows clipboard turns line feeds into CRLF.
  const text = (await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n');
  expect(text).toBe(await page.locator('#prompt code').textContent());
  expect(text).toContain('groupBy');
});
