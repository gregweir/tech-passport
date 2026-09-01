import type { Page } from 'playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080';

export async function resetIndexedDB(page: Page) {
  await page.goto(BASE_URL);
  await page.evaluate(async () => {
    const w = window as unknown as { __resetTechPassportData?: () => Promise<void> };
    if (typeof w.__resetTechPassportData === 'function') {
      await w.__resetTechPassportData();
    }
  });
}
