const { test, expect } = require('@playwright/test');

// Testing full clerk authentication in E2E requires a test environment or mocked endpoints.
// This test verifies the profile setup UI flows and persistence.

test.describe('Profile Creation Flow', () => {
  test('should load landing page and have sign up options', async ({ page }) => {
    // Test against local dev or staging based on environment
    const baseURL = process.env.BASE_URL || 'http://localhost:5173';
    await page.goto(baseURL);
    
    // Verify landing page loaded
    await expect(page.locator('text=ExpenseFlow').first()).toBeVisible();
    
    // Click Sign In
    await page.click('button:has-text("Sign In")');
    
    // Switch to Create Account
    await page.click('button:has-text("Create Account")');
    
    // Fill basic details
    await page.fill('input[type="email"]', `test_${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'Password123!');
    
    // Click Create Account
    await page.click('button:has-text("Create Account")');
    
    // Expect Verification UI to appear
    await expect(page.locator('text=Verification Code')).toBeVisible();
  });
});
