const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const users = require('./testdata/json/all-users.json');

const APP_URL = 'https://d2025.weavers-web.com/login/';
const IMAGE_FOLDER = path.resolve(process.cwd(), 'tests/testdata/profileimages');

// image picker
function getRandomProfileImage() {
  const files = fs.readdirSync(IMAGE_FOLDER)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  return path.join(IMAGE_FOLDER, files[Math.floor(Math.random() * files.length)]);
}

// 🔥 Create separate test per user
users.forEach(user => {

  test(`Update profile → ${user.username}`, async ({ page }) => {

    console.log(`👤 ${user.username}`);

    await page.goto(APP_URL);

    // LOGIN
    await page.getByRole('textbox', { name: 'Enter Your Username' }).fill(user.username);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(user.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await page.waitForLoadState('networkidle');

    // PROFILE UPDATE
    await page.getByRole('button', { name: 'My Account' }).click();
    await page.getByRole('link', { name: 'My Profile' }).click();
    await page.getByRole('button', { name: 'Edit Details' }).click();

    const imagePath = getRandomProfileImage();

    await page.locator('input[type="file"]').setInputFiles(imagePath);

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // LOGOUT
    await page.getByRole('button', { name: 'My Account' }).click();
    await page.getByRole('link', { name: 'Log Out' }).click();
    await page.getByRole('button', { name: 'Yes, Logout' }).click();

  });

});