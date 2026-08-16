const { test, expect } = require('@playwright/test');

test('Try Sign up fixed', async ({ page, isMobile }) => {
  await page.goto('https://expenseflow.site');
  await page.waitForLoadState('networkidle');
  
  if (isMobile) {
    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500); 
    }
  }

  const visibleSignInButton = page.locator('button', { hasText: /Sign in/i }).and(page.locator(':visible')).first();
  if (await visibleSignInButton.isVisible()) {
      await visibleSignInButton.click();
  } else {
      const ctaButton = page.locator('button', { hasText: /Join/i }).and(page.locator(':visible')).first();
      await ctaButton.click();
  }
  
  await page.waitForSelector('text="or continue with email"', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);

  const createAccountTab = page.locator('button', { hasText: /^Create Account$/ }).first();
  await createAccountTab.click();
  await page.waitForTimeout(500);
  
  const emailInput = page.getByPlaceholder('Email Address').first();
  await emailInput.fill(`test-agent-${Date.now()}@example.com`);
  
  const passInput = page.getByPlaceholder('Password').first();
  if (await passInput.isVisible()) {
      await passInput.fill('TestAgentPass123!');
  }

  // Set up console log listener to see if Clerk throws errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log('PAGE ERROR:', exception));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  const submitButton = page.locator('button[type="submit"]', { hasText: /^Create Account$/ }).first();
  await submitButton.click();
  
  console.log("Clicked submit, waiting up to 15 seconds...");
  await page.waitForTimeout(15000);
  await page.screenshot({ path: 'test-results/after-signup-15s.png', fullPage: true });
});
