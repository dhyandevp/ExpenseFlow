const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests-qa',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Enable bypass for bot protection locally if possible
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    // Bypass csp and other security checks in Playwright
    bypassCSP: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // add arguments to help bypass some bot detection
        launchOptions: {
            args: ['--disable-blink-features=AutomationControlled']
        }
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
            args: ['--disable-blink-features=AutomationControlled']
        }
      },
    },
  ],
});
