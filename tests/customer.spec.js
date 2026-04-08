import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://d2025.weavers-web.com/');
  await page.getByRole('link', { name: 'Sign Up' }).click();
  await page.getByRole('link', { name: 'Log In' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Username' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Username' }).fill('customer1');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Web@1234');
  await page.getByRole('button', { name: 'Log In' }).click();
  const shopsLocator = page.locator('.single-item-item');

  await shopsLocator.first().waitFor(); // ensure loaded

  const count = await shopsLocator.count();
  console.log(count)

  const randomIndex = Math.floor(Math.random() * count);

  await shopsLocator.nth(randomIndex).click();
  await page.locator('[name="review"]').fill("Test");
  await page.locator("//div[@class='add-review-wrap']//li[4]//*[name()='svg']//*[name()='path' and contains(@fill,'currentCol')]").click();
  await page.getByRole('button', { name: 'Submit' }).click();



});