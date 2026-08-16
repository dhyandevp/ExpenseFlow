const { chromium } = require('@playwright/test');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log("Loading page...");
    await page.goto('https://expenseflow.site');
    await page.waitForLoadState('networkidle');
    
    console.log("Looking for Join buttons...");
    const buttons = await page.locator('button').allTextContents();
    console.log(buttons.filter(b => b.includes('Join')));
    
    await browser.close();
})();
