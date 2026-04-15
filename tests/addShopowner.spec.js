const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const data = require('./testdata/json/shopData.json');

const APP_URL = 'https://d2025.weavers-web.com/';
const IMAGE_FOLDER = path.resolve(process.cwd(), 'tests/testdata/images');

// ✅ Shuffle helper
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ✅ Single image
function getRandomImage() {
    const files = fs.readdirSync(IMAGE_FOLDER).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    return path.join(IMAGE_FOLDER, files[Math.floor(Math.random() * files.length)]);
}

// ✅ Multiple images (4)
function getMultipleImages(count = 4) {
    const files = fs.readdirSync(IMAGE_FOLDER).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    return shuffle(files).slice(0, count).map(f => path.join(IMAGE_FOLDER, f));
}

// ✅ Create Shop
async function createShop(page, shop) {
    const mainImage = getRandomImage();
    const moreImages = getMultipleImages(4);

    console.log(`📝 Creating: ${shop.shopName}`);
    console.log(`📸 Main Image: ${mainImage}`);
    await page.getByRole('button', { name: 'My Account' }).click();

    await page.getByRole('link', { name: 'Add Shop' }).click();

    await page.getByRole('textbox', { name: 'Name of the shop*' }).fill(shop.shopName);
    await page.getByRole('textbox', { name: 'Email Address*' }).fill(shop.email);
    await page.getByRole('textbox', { name: 'Phone*' }).fill(shop.phone);
    await page.getByRole('textbox', { name: 'Address*', exact: true }).fill(shop.address);

    await page.locator('#category').selectOption('8');
    await page.locator('#sub_category').selectOption('19');
    await page.locator('#state').selectOption('Riyadh Region');
    await page.locator('#city').selectOption('Al Kharj');

    await page.getByRole('textbox', { name: 'Add Working Hours*' }).click();
    await page.getByRole('button', { name: 'Save Schedule' }).click();

    await page.getByRole('textbox', { name: 'Describe your shop specialty' })
        .fill(shop.specialty || '');

    await page.getByRole('textbox', { name: 'Add Description*' })
        .fill(shop.longDesc || '');

    // ✅ Upload main image
    await page.locator('input[type="file"]').nth(0).setInputFiles(mainImage);

    // ✅ Upload multiple images
    const inputs = page.locator('input[type="file"]');
    for (let i = 0; i < moreImages.length; i++) {
        await inputs.nth(i + 1).setInputFiles(moreImages[i]);
    }

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByRole('textbox').first().fill(shop.product || '');

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByRole('button', { name: 'My Account' }).click();
}

// ✅ Test Config
test.use({
    viewport: { width: 1920, height: 1080 },
    storageState: 'storageState.json'
});

// ✅ Test
test('Create Multiple Shops', async ({ page }) => {
    await page.goto(APP_URL);

    for (const shop of data.shops) {
        await createShop(page, shop);
    }
});