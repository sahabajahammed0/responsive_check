const { test, devices } = require('@playwright/test');
const { attachResponsiveAudit } = require('./support/responsiveAudit');

const viewportProfiles = [
  // Chrome/Chromium
  { name: 'Desktop Chrome', type: 'device' },
  { name: 'Desktop Chrome HiDPI', type: 'device' },

  // Firefox
  { name: 'Desktop Firefox', type: 'device' },
  { name: 'Desktop Firefox HiDPI', type: 'device' },

  // Safari
  { name: 'Desktop Safari', type: 'device' },

  // Edge
  { name: 'Desktop Edge', type: 'device' },
  { name: 'Desktop Edge HiDPI', type: 'device' },

  // Requested Macbook aliases (custom, because these names are not Playwright built-ins)
  { name: 'Macbook 11', type: 'viewport', viewport: { width: 1366, height: 768 } },
  { name: 'Macbook 12', type: 'viewport', viewport: { width: 2304, height: 1440 } },
  { name: 'Macbook 13', type: 'viewport', viewport: { width: 1440, height: 900 } },
  { name: 'Macbook 14', type: 'viewport', viewport: { width: 3024, height: 1964 } },
  { name: 'Macbook 15', type: 'viewport', viewport: { width: 2880, height: 1800 } },
  { name: 'Macbook 16', type: 'viewport', viewport: { width: 3456, height: 2234 } },

  { name: 'Macbook Pro 11', type: 'viewport', viewport: { width: 1366, height: 768 } },
  { name: 'Macbook Pro 12', type: 'viewport', viewport: { width: 2304, height: 1440 } },
  { name: 'Macbook Pro 13', type: 'viewport', viewport: { width: 2560, height: 1600 } },
  { name: 'Macbook Pro 14', type: 'viewport', viewport: { width: 3024, height: 1964 } },
  { name: 'Macbook Pro 15', type: 'viewport', viewport: { width: 2880, height: 1800 } },
  { name: 'Macbook Pro 16', type: 'viewport', viewport: { width: 3456, height: 2234 } },

  // Custom Windows laptops
  { name: 'Laptop HD', type: 'viewport', viewport: { width: 1366, height: 768 } },
  { name: 'Laptop Full HD', type: 'viewport', viewport: { width: 1920, height: 1080 } },
  { name: 'Laptop 2K', type: 'viewport', viewport: { width: 2560, height: 1440 } },
  { name: 'Laptop 4K', type: 'viewport', viewport: { width: 3840, height: 2160 } },

  // Additional MacBooks from your custom set
  { name: 'MacBook Air 13', type: 'viewport', viewport: { width: 1440, height: 900 } },
  { name: 'MacBook Pro 13 (Custom)', type: 'viewport', viewport: { width: 2560, height: 1600 } },
  { name: 'MacBook Pro 14 (Custom)', type: 'viewport', viewport: { width: 3024, height: 1964 } },
  { name: 'MacBook Pro 16 (Custom)', type: 'viewport', viewport: { width: 3456, height: 2234 } },

  // Desktop monitors
  { name: 'Desktop 1080p', type: 'viewport', viewport: { width: 1920, height: 1080 } },
  { name: 'Desktop 1440p', type: 'viewport', viewport: { width: 2560, height: 1440 } },
  { name: 'Desktop 4K', type: 'viewport', viewport: { width: 3840, height: 2160 } },
  { name: 'Desktop Ultrawide', type: 'viewport', viewport: { width: 3440, height: 1440 } },
];

for (const profile of viewportProfiles) {
  test(`Responsive check on ${profile.name}`, async ({ browser }, testInfo) => {
    const contextOptions = {};

    if (profile.type === 'device') {
      if (!devices[profile.name]) {
        test.skip(true, `Unsupported Playwright device profile: ${profile.name}`);
      }

      const { defaultBrowserType, ...deviceConfig } = devices[profile.name];
      Object.assign(contextOptions, deviceConfig);
    } else {
      contextOptions.viewport = profile.viewport;
      contextOptions.screen = profile.viewport;
      contextOptions.deviceScaleFactor = 1;
      contextOptions.isMobile = false;
      contextOptions.hasTouch = false;
    }

    const context = await browser.newContext(contextOptions);

    try {
      const page = await context.newPage();

      await page.goto('https://vd-web.weavers-web.com/', { waitUntil: 'domcontentloaded' });

      await page.getByRole('textbox', { name: 'First Name Last Name Email' }).fill('Wasim');
      await page.locator('input[name="lastName"]').fill('Ahammed');
      await page.locator('input[name="emailAddress"]').fill('wasim@yopmail.com');
      await page.locator('input[name="phoneNumber"]').fill('7897275895');
      await page.locator('input[name="subject"]').fill('Desktop responsive');
      await page.getByRole('textbox', { name: 'Message', exact: true }).fill(`Check responsive layout on ${profile.name}`);

      await page.getByRole('button', { name: 'Submit' }).click();

      await attachResponsiveAudit(page, testInfo, {
        deviceName: profile.name,
        scenario: 'contact-form-submit',
      });
    } finally {
      await context.close();
    }
  });
}
