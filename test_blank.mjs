import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://expenseflow.site');
  
  // Set fake currentGroup in localStorage
  await page.evaluate(() => {
    localStorage.setItem("expenseflow_group", "{}");
  });
  
  await page.goto('https://expenseflow.site/group/123/dashboard');
  
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'blank_screen.png' });
  const text = await page.innerText('body');
  console.log("Body length:", text.length);
  console.log("Body:", text);
  
  await browser.close();
})();
