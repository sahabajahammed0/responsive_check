const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { attachResponsiveAudit } = require('./support/responsiveAudit');

const APP_URL = 'https://d2025.weavers-web.com/';
const IMAGE_FOLDER = path.resolve(process.cwd(), 'tests/testdata/images');

const viewportProfiles = [
  { name: 'mobile-small', size: { width: 360, height: 740 } },
  { name: 'mobile-large', size: { width: 430, height: 932 } },
  { name: 'tablet', size: { width: 768, height: 1024 } },
  { name: 'desktop', size: { width: 1366, height: 768 } },
  { name: 'desktop-wide', size: { width: 1920, height: 1080 } },
];

const shopPrefixes = ['Al', 'AL restureant', "Abu Jassar Shawarma", "Al Baik Express", "Al Shorfa Seafood"];
const shopTypes = ['Bar', 'Pub', 'Tavern', 'Lounge', 'Cafe', 'Restaurant'];
const phonePrefixes = ['789', '987', '654', '321'];
const descriptions = [
  'This is a premium establishment offering',
  'Welcome to our cozy venue featuring',
  'Experience the best service with',
  'Your neighborhood destination for',
];
const longDescOptions = [
  'Demo content for our amazing shop. We provide exceptional service.',
  'A wonderful place to relax and enjoy. Come visit us today!',
  'Quality products and services in a friendly environment.',
];
const amenities = ['Wifi cable', 'Free WiFi', 'Parking', 'Outdoor Seating', 'TV', 'Live Music'];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildShopData(contextLabel) {
  const timestamp = Date.now();
  const unique = `${Math.floor(Math.random() * 10000)}-${contextLabel}`;

  return {
    shopName: `${randomFrom(shopPrefixes)} ${randomFrom(shopTypes)} ${unique}`,
    email: `weavers${timestamp}${Math.floor(Math.random() * 1000)}@yopmail.com`,
    phone: `${randomFrom(phonePrefixes)}${Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(7, '0')}`,
    specialty: `${randomFrom(descriptions)} quality service and great atmosphere`,
    longDesc: randomFrom(longDescOptions),
    amenity: randomFrom(amenities),
  };
}

function resolveUploadImage() {
  const imageFiles = fs
    .readdirSync(IMAGE_FOLDER)
    .filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName))
    .map((fileName) => path.join(IMAGE_FOLDER, fileName));

  if (imageFiles.length === 0) {
    throw new Error(`No image files found in: ${IMAGE_FOLDER}`);
  }

  return randomFrom(imageFiles);
}

async function loginAsShopOwner(page) {
  await page.goto(APP_URL);
  await page.getByRole('link', { name: 'Sign Up' }).click();
  await page.getByRole('link', { name: 'Log In' }).click();
  await page.locator('span').nth(2).click();
  await page.getByRole('textbox', { name: 'Enter Your Username' }).fill('shopowner1');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Web@1234');
  await page.getByRole('button', { name: 'Log In' }).click();
}

async function createShop(page, shopData, imagePath) {
  await page.getByRole('link', { name: 'Add Shop' }).click();

  await page.getByRole('textbox', { name: 'Name of the shop*' }).fill(shopData.shopName);
  await page.getByRole('textbox', { name: 'Email Address*' }).fill(shopData.email);
  await page.getByRole('textbox', { name: 'Phone*' }).fill(shopData.phone);
  await page.getByRole('textbox', { name: 'Address*', exact: true }).fill('Saudi Arabia');

  await page.locator('#category').selectOption('8');
  await page.locator('#sub_category').selectOption('19');
  await page.locator('#state').selectOption('Riyadh Region');
  await page.locator('#city').selectOption('Al Kharj');

  await page.getByRole('textbox', { name: 'Add Working Hours*' }).click();
  await page.getByRole('button', { name: 'Save Schedule' }).click();

  await page.getByRole('textbox', { name: 'Describe your shop specialty' }).fill(shopData.specialty);
  await page.getByRole('textbox', { name: 'Add Description*' }).fill(shopData.longDesc);

  await page.getByText('Drag & Drop or Choose file').first().click();
  await page.locator('input[type="file"]').first().setInputFiles(imagePath);

  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('textbox').fill(shopData.amenity);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
}

test.describe('Shop Creation Cross Browser + Viewports', () => {
  test.describe.configure({ mode: 'serial' });

  for (const viewport of viewportProfiles) {
    test(`create shop on ${viewport.name}`, async ({ page, browserName }, testInfo) => {
      await page.setViewportSize(viewport.size);

      const contextLabel = `${browserName}-${viewport.name}`;
      const shopData = buildShopData(contextLabel);
      const imagePath = resolveUploadImage();

      console.log(`Running: ${contextLabel}`);
      console.log(`Generated shop name: ${shopData.shopName}`);
      console.log(`Generated email: ${shopData.email}`);
      console.log(`Uploading image: ${imagePath}`);

      await loginAsShopOwner(page);
      await createShop(page, shopData, imagePath);

      const report = await attachResponsiveAudit(page, testInfo, {
        deviceName: contextLabel,
        scenario: 'add-shop',
      });

      if (report.totalIssues > 0) {
        console.warn(`Responsive issues found on ${contextLabel}: ${report.totalIssues}`);
      }

      console.log(`Shop flow completed: ${shopData.shopName}`);
    });
  }
});