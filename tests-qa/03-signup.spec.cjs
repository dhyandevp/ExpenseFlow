const { test, expect } = require('@playwright/test');

test('Try Sign up', async ({ page }) => {
  await page.goto('https://expenseflow.site');
  
  const signinButton = page.locator('text=/Sign in|Log in/i').first();
  await signinButton.click();
  
  // Click "Create Account" tab/button if it exists
  const createAccountTab = page.locator('button:has-text("Create Account")').first();
  if (await createAccountTab.isVisible()) {
    await createAccountTab.click();
  }

  // Fill in email
  const emailInput = page.locator('input[name="emailAddress"]').first();
  await emailInput.fill('test-agent-1@example.com');
  
  const passInput = page.locator('input[name="password"]').first();
  if (await passInput.isVisible()) {
      await passInput.fill('TestAgentPass123!');
  }

  // Click continue/submit
  const submitButton = page.locator('button:has-text("Continue"), button:has-text("Sign Up")').first();
  await submitButton.click();
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/after-signup.png', fullPage: true });
});
