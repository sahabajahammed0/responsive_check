const { test, devices } = require('@playwright/test');
const { attachResponsiveAudit } = require('./support/responsiveAudit');

const deviceList = [
  'iPhone 13',
  'iPhone 14',
  'iPhone 15',
  'Galaxy S8',
  'Galaxy S9+',
  'iPad Pro 11',
  'iPhone 14 Pro Max',
  'Galaxy S24',
  'Pixel 7',
  'Galaxy S5'

  


];

for (const deviceName of deviceList) {

  // Skip unsupported devices
  if (!devices[deviceName]) {
    console.log(`Skipping unsupported device: ${deviceName}`);
    continue;
  }

  test(`Responsive check on ${deviceName}`, async ({ browser }, testInfo) => {
    const { defaultBrowserType, ...deviceConfig } = devices[deviceName];

    const context = await browser.newContext({
      ...deviceConfig,
    });

    try {
      const page = await context.newPage();

      await page.goto('https://vd-web.weavers-web.com/', { waitUntil: 'domcontentloaded' });

      await page.getByRole('textbox', { name: 'First Name Last Name Email' }).fill('Wasim');
      await page.locator('input[name="lastName"]').fill('Ahammed');
      await page.locator('input[name="emailAddress"]').fill('wasim@yopmail.com');
      await page.locator('input[name="phoneNumber"]').fill('7897275895');
      await page.locator('input[name="subject"]').fill('Mobile responsive');
      await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Check mobile');

      await page.getByRole('button', { name: 'Submit' }).click();

      await attachResponsiveAudit(page, testInfo, {
        deviceName,
        scenario: 'contact-form-submit',
      });
    } finally {
      await context.close();
    }
  });

}
