import { test, expect } from 'playwright/test';
import { resetIndexedDB } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetIndexedDB(page);
});

async function completeOnboarding(page: import('playwright').Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to Tech Passport' })).toBeVisible();
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

test('onboarding creates first device', async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Tech Passport' })).toBeVisible();
});
