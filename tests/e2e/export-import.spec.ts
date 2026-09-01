import { test, expect } from 'playwright/test';
import { resetIndexedDB } from './helpers';

async function completeOnboardingIfShown(page: import('playwright').Page) {
  const welcome = page.getByRole('heading', { name: 'Welcome to Tech Passport' });
  if (await welcome.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByLabel('Choose one').selectOption('My computer');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Operating system').selectOption('Mac');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Name').fill('My MacBook Air');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Backup status').selectOption('Yes');
    await page.getByLabel('Where is the backup?').fill('External drive + iCloud');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
  }
}

test.beforeEach(async ({ page }) => {
  await resetIndexedDB(page);
});

test('exports and imports a full JSON backup', async ({ page }) => {
  await page.goto('/');
  await completeOnboardingIfShown(page);

  await page.goto('/#/export');
  await expect(page.getByRole('button', { name: 'Full JSON backup' })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Full JSON backup' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});
