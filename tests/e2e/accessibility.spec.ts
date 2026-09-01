import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
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

const ROUTES = ['/', '/people', '/devices', '/accounts', '/backups', '/recovery', '/dependencies', '/reviews', '/export', '/passport'];

for (const route of ROUTES) {
  test(`page ${route || '/'} has no detectable accessibility issues`, async ({ page }) => {
    await page.goto(`#${route}`);
    await completeOnboardingIfShown(page);
    await expect(page.getByRole('heading').first()).toBeVisible();

    const builder = new AxeBuilder({ page });
    if (route === '/passport') {
      builder.exclude('iframe');
    }
    const accessibilityScanResults = await builder.analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
}
