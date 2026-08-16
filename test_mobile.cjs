const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const page = await context.newPage();
  
  // Navigate to production or local depending on deployment
  await page.goto('https://expenseflow.site');
  
  // Take a screenshot of the home page
  await page.screenshot({ path: 'mobile_home.png', fullPage: true });
  console.log("Captured mobile home screenshot.");

  await browser.close();
})();
