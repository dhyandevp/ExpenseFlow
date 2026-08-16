const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://expenseflow.site/sso-callback');
  // just observe what it does
  await page.waitForTimeout(5000);
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  console.log('Body:', await page.innerHTML('body'));
  await browser.close();
})();
