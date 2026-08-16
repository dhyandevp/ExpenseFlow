const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://expenseflow.site', { waitUntil: 'networkidle' });
  
  console.log("Checking Landing Page...");
  const title = await page.title();
  console.log("Title:", title);
  
  console.log("Clicking Join with Code...");
  await page.click('button:has-text("Join with Code")');
  await page.waitForTimeout(1000);
  
  console.log("Checking modal presence...");
  const modalText = await page.textContent('h2:has-text("Join as Guest")');
  console.log("Modal Title:", modalText);

  await page.fill('input[placeholder="Enter Group Code (e.g., TEAM24)"]', 'INVALID_CODE');
  
  // Enter PIN into the PIN inputs. It's 6 inputs.
  const pinInputs = await page.$$('input[type="text"]:not([placeholder="Enter Group Code (e.g., TEAM24)"])');
  for(let i=0; i<6; i++) {
    if(pinInputs[i]) {
      await pinInputs[i].fill('1');
    }
  }

  await page.click('button:has-text("Join Group")');
  await page.waitForTimeout(3000);
  
  // We expect an error about network or invalid code
  const errorMsg = await page.textContent('p.text-red-500, p.text-red-600');
  console.log("Error shown to user:", errorMsg);

  await browser.close();
}
run().catch(console.error);
