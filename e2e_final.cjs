const { chromium, firefox } = require('playwright');
const fs = require('fs');

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: false }); // Headless: false to potentially pass Turnstile
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 1. Landing Page
  console.log("Step 1: Landing page");
  await page.goto('https://expenseflow.site');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'step1_landing.png' });
  console.log("Landing page loaded successfully.");

  // 2. Sign In
  console.log("Step 2: Sign in");
  await page.click('text="Get Started"');
  await page.waitForTimeout(2000); // Wait for Clerk UI to load
  await page.screenshot({ path: 'step2_signin_prompt.png' });

  // Since it's production, we need a real or test account.
  // Wait, does the production site have a test account we can use?
  // Let's see if we can log in with a test email.
  // If Turnstile blocks it, we'll see it here.
  
  console.log("Attempting login...");
  try {
    const emailInput = await page.locator('input[type="email"], input[name="identifier"]');
    if (await emailInput.isVisible()) {
       await emailInput.fill('testagent@example.com');
       await page.click('button:has-text("Continue")');
       // Wait to see if it asks for password/code or blocks
       await page.waitForTimeout(3000);
       await page.screenshot({ path: 'step2_signin_after_email.png' });
    } else {
       console.log("Email input not visible. Using Clerk redirect?");
    }
  } catch (err) {
    console.log("Sign in automation encountered an issue:", err.message);
  }

  await browser.close();
  console.log("Phase 1 testing complete.");
}

run().catch(console.error);
