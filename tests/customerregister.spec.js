import { test, expect, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const viewportProfiles = [
  { name: 'Desktop Chrome', type: 'device' },
  { name: 'Desktop Chrome HiDPI', type: 'device' },
  { name: 'Desktop Firefox', type: 'device' },
  { name: 'Desktop Firefox HiDPI', type: 'device' },
  { name: 'Desktop Safari', type: 'device' },
  { name: 'Desktop Edge', type: 'device' },
  { name: 'Desktop Edge HiDPI', type: 'device' },
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
  { name: 'Laptop HD', type: 'viewport', viewport: { width: 1366, height: 768 } },
  { name: 'Laptop Full HD', type: 'viewport', viewport: { width: 1920, height: 1080 } },
  { name: 'Laptop 2K', type: 'viewport', viewport: { width: 2560, height: 1440 } },
  { name: 'Laptop 4K', type: 'viewport', viewport: { width: 3840, height: 2160 } },
  { name: 'MacBook Air 13', type: 'viewport', viewport: { width: 1440, height: 900 } },
  { name: 'MacBook Pro 13 (Custom)', type: 'viewport', viewport: { width: 2560, height: 1600 } },
  { name: 'MacBook Pro 14 (Custom)', type: 'viewport', viewport: { width: 3024, height: 1964 } },
  { name: 'MacBook Pro 16 (Custom)', type: 'viewport', viewport: { width: 3456, height: 2234 } },
  { name: 'Desktop 1080p', type: 'viewport', viewport: { width: 1920, height: 1080 } },
  { name: 'Desktop 1440p', type: 'viewport', viewport: { width: 2560, height: 1440 } },
  { name: 'Desktop 4K', type: 'viewport', viewport: { width: 3840, height: 2160 } },
  { name: 'Desktop Ultrawide', type: 'viewport', viewport: { width: 3440, height: 1440 } },
];

function contextOptionsFor(profile) {
  if (profile.type === 'device') {
    if (!devices[profile.name]) {
      return null;
    }

    const { defaultBrowserType, ...deviceConfig } = devices[profile.name];
    return { ...deviceConfig };
  }

  return {
    viewport: profile.viewport,
    screen: profile.viewport,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  };
}

for (const profile of viewportProfiles) {
  test.describe(`Customer Register | ${profile.name}`, () => {
    // Test 1: Create user and store credentials
    test('Create user and store in individual JSON file', async ({ browser }) => {
      const contextOptions = contextOptionsFor(profile);
      test.skip(!contextOptions, `Unsupported Playwright device profile: ${profile.name}`);

      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();

      try {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);

        const firstNames = ['john', 'james', 'robert', 'michael', 'david', 'william', 'richard', 'thomas', 'charles', 'joseph'];
        const lastNames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis'];
        const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${randomFirstName}${randomLastName}${randomNum}`;

        const phoneNumber = `5${Math.floor(Math.random() * 1000000000).toString().padStart(8, '0')}`;
        const email = `${name.toLowerCase()}@yopmail.com`;
        const password = 'Web@1234';

        console.log(`Creating user on ${profile.name}: ${name}`);

        await page.goto('https://d2025.weavers-web.com/sign-up/');
        await page.getByRole('textbox', { name: 'Enter Your Name*' }).fill(name);
        await page.locator('#state').selectOption('Riyadh Region');
        await page.locator('#city').selectOption('Al Kharj');
        await page.getByRole('textbox', { name: 'Enter Your Phone Number' }).fill(phoneNumber);
        await page.getByRole('textbox', { name: 'Enter Your Email Address' }).fill(email);
        await page.getByRole('button', { name: 'Sign Up' }).click();
        await page.getByRole('button', { name: 'OK' }).click();

        await page.getByRole('textbox', { name: 'Enter Your Username' }).fill(name);
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);
        await page.getByRole('button', { name: 'Log In' }).click();

        const userData = {
          username: name,
          password,
          email,
          phone: phoneNumber,
          fullName: name,
          createdAt: new Date().toISOString(),
          testRun: timestamp,
          viewport: profile.name,
        };

        const usersDir = './test-data/users';
        if (!fs.existsSync(usersDir)) {
          fs.mkdirSync(usersDir, { recursive: true });
        }

        const safeViewport = profile.name.replace(/[^a-zA-Z0-9_-]+/g, '_');
        const fileName = `${name}_${safeViewport}_${timestamp}.json`;
        const filePath = path.join(usersDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

        const masterFilePath = './test-data/all-users.json';
        let allUsers = [];
        if (fs.existsSync(masterFilePath)) {
          allUsers = JSON.parse(fs.readFileSync(masterFilePath, 'utf8'));
        }

        allUsers.push({
          username: name,
          password,
          file: fileName,
          createdAt: new Date().toISOString(),
          viewport: profile.name,
        });

        fs.writeFileSync(masterFilePath, JSON.stringify(allUsers, null, 2));
        console.log(`User saved: ${filePath}`);
      } finally {
        await context.close();
      }
    });

    // Test 2: Read credentials and submit review
    test('Submit review with random rating', async ({ browser }) => {
      const contextOptions = contextOptionsFor(profile);
      test.skip(!contextOptions, `Unsupported Playwright device profile: ${profile.name}`);

      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();

      try {
        const masterFilePath = './test-data/all-users.json';

        if (!fs.existsSync(masterFilePath)) {
          throw new Error('No users found. Please run the create user test first.');
        }

        const allUsers = JSON.parse(fs.readFileSync(masterFilePath, 'utf8'));
        if (allUsers.length === 0) {
          throw new Error('User list is empty. Please create a user first.');
        }

        const latestUserForViewport = [...allUsers].reverse().find((u) => u.viewport === profile.name);
        const latestUser = latestUserForViewport || allUsers[allUsers.length - 1];

        const username = latestUser.username;
        const password = latestUser.password;

        console.log(`Using credentials on ${profile.name}: ${username}`);

        await page.goto('https://d2025.weavers-web.com/');
        await page.getByRole('link', { name: 'Sign Up' }).click();
        await page.getByRole('link', { name: 'Log In' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Username' }).fill(username);
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);
        await page.getByRole('button', { name: 'Log In' }).click();

        const shopsLocator = page.locator('.single-item-item');
        await expect(shopsLocator.first()).toBeVisible({ timeout: 10000 });

        const shopCount = await shopsLocator.count();
        if (shopCount === 0) {
          throw new Error('No shops found to review');
        }

        const randomShopIndex = Math.floor(Math.random() * shopCount);
        await shopsLocator.nth(randomShopIndex).click();

        const reviewTexts = [
          'Great service and atmosphere!',
          'Wonderful experience, will visit again.',
          'Amazing place with friendly staff.',
          'Good quality products and reasonable prices.',
          'Highly recommended!',
        ];

        const randomReview = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        await page.locator('[name="review"]').fill(randomReview);

        const ratingElements = page.locator('#ratingBox li');
        const ratingCount = await ratingElements.count();

        if (ratingCount > 0) {
          const randomRating = Math.floor(Math.random() * ratingCount) + 1;
          await ratingElements.nth(randomRating - 1).click();
        }

        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(2000);
      } finally {
        await context.close();
      }
    });
  });
}
