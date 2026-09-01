import { test, expect } from 'playwright/test';
import { resetIndexedDB } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetIndexedDB(page);
});

test('mobile hamburger menu opens and navigates', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: 'Toggle navigation menu' });
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

  const addOrUpdateButton = page.getByRole('button', { name: 'Add or update' });
  await expect(addOrUpdateButton).toBeVisible();
  await addOrUpdateButton.click();

  const devicesLink = page.getByRole('link', { name: 'Devices' });
  await expect(devicesLink).toBeVisible();
  await devicesLink.click();

  await expect(page.getByRole('heading', { name: 'Devices' })).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});
