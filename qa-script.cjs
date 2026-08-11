const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('ERR_FAILED')) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    // Clear state
    await page.goto('http://localhost:8888');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));
    });

    // FLOW 1 — LANDING PAGE AS A NEW VISITOR
    await page.goto('http://localhost:8888');
    await page.waitForTimeout(1000);
    
    const title = await page.title();
    const h1 = await page.locator('h1').innerText();
    const signInVisible = await page.getByRole('button', { name: /sign in/i }).first().isVisible();
    const joinCodeVisible = await page.getByRole('button', { name: /join with/i }).first().isVisible();
    
    // Check links
    await page.getByRole('link', { name: /terms/i }).click();
    await page.waitForURL('**/terms');
    const termsVisible = await page.locator('h1', { hasText: 'Terms of Service' }).isVisible();
    
    await page.goto('http://localhost:8888');
    await page.getByRole('link', { name: /privacy/i }).click();
    await page.waitForURL('**/privacy');
    const privacyVisible = await page.locator('h1', { hasText: 'Privacy Policy' }).isVisible();
    
    await page.goto('http://localhost:8888');
    await page.getByRole('link', { name: /contact/i }).click();
    await page.waitForURL('**/contact');
    const contactVisible = await page.locator('h1', { hasText: 'Contact Us' }).isVisible();
    
    await page.goto('http://localhost:8888');

    // Mobile View
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    
    const horizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    
    const navCount = await page.locator('nav').count();
    const hasRed = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      for (let el of all) {
        if (window.getComputedStyle(el).color === 'rgb(239, 68, 68)' || window.getComputedStyle(el).backgroundColor === 'rgb(239, 68, 68)') return true;
      }
      return false;
    });
    
    console.log(JSON.stringify({
      title, h1, signInVisible, joinCodeVisible,
      termsVisible, privacyVisible, contactVisible,
      horizontalScroll, navCount, hasRed, errors
    }));
  } catch(e) {
    console.log(JSON.stringify({ error: e.message, stack: e.stack }));
  } finally {
    await browser.close();
  }
})();
