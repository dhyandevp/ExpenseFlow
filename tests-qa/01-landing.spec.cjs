const { test, expect } = require('@playwright/test');

test.describe('Landing Page Audit', () => {
  test('landing page visual and link check', async ({ page }) => {
    // Navigate to the live production site
    const response = await page.goto('https://expenseflow.site');
    expect(response.status()).toBe(200);

    // Take a screenshot of the landing page
    await page.screenshot({ path: 'test-results/landing-audit.png', fullPage: true });

    // Check for obvious text like title or hero
    const title = await page.title();
    console.log('Page Title:', title);

    // Look for broken links by extracting all hrefs
    const hrefs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => a.getAttribute('href'))
        .filter(href => href && !href.startsWith('#') && !href.startsWith('mailto:'));
    });
    console.log('Found Links:', hrefs);

    // Check for CTA buttons
    const ctaLocators = [/Sign in/i, /Log in/i, /Join/i, /Get Started/i, /Create Group/i];
    for (const cta of ctaLocators) {
      const btn = page.locator(`text=${cta.source}`).first();
      try {
        if (await btn.isVisible()) {
          console.log(`CTA Visible: ${cta.source}`);
        }
      } catch(e) {}
    }
  });
});
