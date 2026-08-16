import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://expenseflow.site');
  
  await page.locator('button', { hasText: 'Sign In' }).first().click();
  await page.waitForSelector('input[type="email"]');
  
  await page.locator('button', { hasText: 'Create Account' }).click();
  
  await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
  await page.fill('input[type="password"]', 'P@ssword123!');
  
  await page.locator('button[type="submit"]').click();
  
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: 'after_login.png' });
  
  await browser.close();
})();
