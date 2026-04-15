const { test } = require('@playwright/test');
const data = require('./testdata/json/auth.json');

test('Login and save session', async ({ page }) => {
    await page.goto('https://d2025.weavers-web.com/');

    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.locator('span').nth(2).click();

    await page.getByRole('textbox', { name: 'Enter Your Username' }).fill(data.login.username);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(data.login.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await page.context().storageState({ path: 'storageState.json' });
});