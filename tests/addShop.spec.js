const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const data = require('./testdata/json/shopData.json');

const APP_URL = 'https://d2025.weavers-web.com/';
const IMAGE_FOLDER = path.resolve(process.cwd(), 'tests/testdata/images');

// ✅ IMAGE FUNCTION
function resolveUploadImage() {
    const imageFiles = fs
        .readdirSync(IMAGE_FOLDER)
        .filter(file => /\.(jpe?g|png|webp)$/i.test(file));

    if (imageFiles.length === 0) {
        throw new Error(`❌ No images found in: ${IMAGE_FOLDER}`);
    }

    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    return path.join(IMAGE_FOLDER, randomImage);
}


function UploadMoreImages(count = 4) {
    const imageFiles = fs
        .readdirSync(IMAGE_FOLDER)
        .filter(file => /\.(jpe?g|png|webp)$/i.test(file));

    if (imageFiles.length < count) {
        throw new Error(`❌ Need at least ${count} images in: ${IMAGE_FOLDER}`);
    }

    // 🔀 Shuffle array
    const shuffled = imageFiles.sort(() => 0.5 - Math.random());

    // 🎯 Pick first N images
    const selected = shuffled.slice(0, count);

    // 📂 Convert to full paths
    return selected.map(file => path.join(IMAGE_FOLDER, file));
}

// ✅ LOGIN
async function login(page) {
    await page.goto(APP_URL);
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.locator('span').nth(2).click();

    await page.getByRole('textbox', { name: 'Enter Your Username' }).fill(data.login.username);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(data.login.password);
    await page.getByRole('button', { name: 'Log In' }).click();
}

// ✅ CREATE SHOP
async function createShop(page, shopData) {
    const imagePath = resolveUploadImage();
    const uplaodmoreImage = UploadMoreImages();

    console.log(`📸 Image: ${imagePath}`);
    console.log(`📝 Shop: ${shopData.shopName}`);


    await page.getByRole('link', { name: 'Add Shop' }).click();

    await page.getByRole('textbox', { name: 'Name of the shop*' }).fill(shopData.shopName);
    await page.getByRole('textbox', { name: 'Email Address*' }).fill(shopData.email);
    await page.getByRole('textbox', { name: 'Phone*' }).fill(shopData.phone);

    // ✅ Safe address
    await page.getByRole('textbox', { name: 'Address*', exact: true })
        .fill(shopData.address || 'Saudi Arabia');



    await page.locator('#category').selectOption('9');
    await page.locator('#sub_category').selectOption('16');
    await page.locator('#state').selectOption('Makkah Region');
    await page.locator('#city').selectOption('Jeddah');
    await page.getByRole('textbox', { name: 'Address*', exact: true }).click();
    await page.getByRole('textbox', { name: 'Address*', exact: true }).fill('makkah');
    await page.getByRole('textbox', { name: 'Address*', exact: true }).press('ArrowDown');
    await page.getByRole('textbox', { name: 'Address*', exact: true }).press('Tab');



    // await page.locator('#category').selectOption('8');
    // await page.locator('#sub_category').selectOption('19');
    // await page.locator('#state').selectOption('Riyadh Region');
    // await page.locator('#city').selectOption('Al Kharj');

    await page.getByRole('textbox', { name: 'Add Working Hours*' }).click();
    await page.getByRole('button', { name: 'Save Schedule' }).click();

    // ✅ FIXED: use longDesc
    await page.getByRole('textbox', { name: 'Describe your shop specialty' })
        .fill(shopData.specialty || '');

    await page.getByRole('textbox', { name: 'Add Description*' })
        .fill(shopData.longDesc || '');

    // ✅ IMAGE UPLOAD
    await page.locator('input[type="file"]').first().setInputFiles(imagePath);
    await page.locator('input[type="file"]').last().setInputFiles(uplaodmoreImage);



    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // ✅ FIXED: use proper field
    await page.getByRole('textbox').first().fill(shopData.product || '');

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByRole('button', { name: 'My Account' }).click();
}

// ✅ TEST
test.use({
    viewport: { width: 1920, height: 1080 } // 🔥 FIX viewport properly
});

test('Create Multiple Shops (JSON + Folder Images)', async ({ page }) => {

    await login(page);

    for (const shop of data.shops) {
        await createShop(page, shop);
    }
});