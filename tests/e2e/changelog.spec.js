import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

test('the changelog page lists the releases of CHANGELOG.md, newest first', async ({ page }) => {
  await page.goto('/changelog.html');
  const releases = page.locator('#releases .release');
  const first = releases.filter({ hasText: `v${version}` }).first();
  await expect(first).toBeVisible();
  await expect(first.locator('.release-badge').first()).toHaveText('ล่าสุด');
  await expect(releases.last().locator('.release-version')).toHaveText('v1.0.1');
  // A section title is shown in Thai; the BREAKING release carries a red badge.
  await expect(page.getByRole('heading', { name: 'เพิ่มใหม่' }).first()).toBeVisible();
  await expect(page.locator('.release-badge.breaking').first()).toBeVisible();
});

test('older releases start collapsed and expand all / collapse all work', async ({ page }) => {
  await page.goto('/changelog.html');
  const releases = page.locator('#releases details');
  expect(await releases.count()).toBeGreaterThan(3);
  await expect(releases.last()).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'ขยายทั้งหมด' }).click();
  await expect(releases.last()).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'ย่อทั้งหมด' }).click();
  await expect(releases.first()).not.toHaveAttribute('open', '');
});

test('a #vX-Y-Z link opens that release', async ({ page }) => {
  await page.goto('/changelog.html#v1-0-1');
  await expect(page.locator('#v1-0-1')).toHaveAttribute('open', '');
});

test('the upgrade guide covers using and releasing, and the nav reaches both pages', async ({
  page,
}) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'เมนูตัวอย่าง' });
  await nav.getByRole('link', { name: 'คู่มืออัปเดตเวอร์ชัน' }).click();
  await expect(page).toHaveURL(/\/upgrade\.html$/);

  const use = page.getByRole('region', { name: 'อัปเดต SPGrid ในโปรเจกต์ที่ใช้งาน' });
  await expect(use).toContainText('npm update @siampiwat/spgrid');
  await expect(use).toContainText('npm install @siampiwat/spgrid@latest');
  const release = page.getByRole('region', { name: /ออกเวอร์ชันใหม่/ });
  await expect(release).toContainText('.\\release.ps1 -Bump minor');
  await expect(release).toContainText('deploy-site.ps1 -Pack');
  expect(await page.locator('.install pre').count()).toBe(
    await page.locator('.code-block').count(),
  );

  await page.getByRole('link', { name: 'ประวัติการเปลี่ยนแปลง' }).first().click();
  await expect(page).toHaveURL(/\/changelog\.html$/);
  await expect(nav.getByRole('link', { name: 'ประวัติการเปลี่ยนแปลง' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});
