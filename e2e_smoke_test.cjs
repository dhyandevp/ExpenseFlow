const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
    const testData = JSON.parse(fs.readFileSync('.test-group.json', 'utf8'));

    // Launch headless Chromium
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log("Navigating to production site...");
    await page.goto('https://expenseflow.site');
    await page.waitForLoadState('networkidle');

    console.log("Using 'Join with Code' as a guest to bypass Clerk login...");
    // Find the Join with Code button. In the DOM there might be multiple (mobile menu, hero, features). We use the first visible one.
    const joinCta = page.locator('button', { hasText: 'Join with Code' }).first();
    await joinCta.click();
    await page.waitForTimeout(500);

    // Look for the code input
    const codeInput = page.getByPlaceholder('e.g. A1B2C3').first();
    await codeInput.fill(testData.code);
    
    // Look for the PIN inputs
    const pinStr = testData.pin;
    for (let i = 0; i < 6; i++) {
        // Because auto-focus might happen, we just fill by label
        const pinInput = page.locator(`input[aria-label="Digit ${i + 1}"]`);
        await pinInput.fill(pinStr[i]);
        // The component auto-submits when the 6th digit is filled.
    }

    console.log("Waiting to land on group dashboard...");
    await page.waitForURL('**/group/*/dashboard', { timeout: 15000 });
    
    console.log("Taking screenshot of dashboard...");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/dashboard-guest.png', fullPage: true });

    console.log("🎉 Successfully joined as a Guest and reached Dashboard!");
    await browser.close();
})();
