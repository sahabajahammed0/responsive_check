import { test, expect } from '@playwright/test';

test('Submit review with random rating', async ({ page }) => {
  // Login
  await page.goto('https://d2025.weavers-web.com/');
  await page.getByRole('link', { name: 'Sign Up' }).click();
  await page.getByRole('link', { name: 'Log In' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Username' }).fill('customer1');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Web@1234');
  await page.getByRole('button', { name: 'Log In' }).click();

  // Wait for shops to load
  const shopsLocator = page.locator('.single-item-item');
  await expect(shopsLocator.first()).toBeVisible({ timeout: 10000 });

  const shopCount = await shopsLocator.count();
  console.log(`📊 Total shops available: ${shopCount}`);

  if (shopCount === 0) {
    throw new Error('No shops found to review');
  }

  // Select random shop
  const randomShopIndex = Math.floor(Math.random() * shopCount);
  await shopsLocator.nth(randomShopIndex).click();
  console.log(`🏪 Selected shop index: ${randomShopIndex}`);

  // Generate dynamic review content
  const reviewTexts = [
    'Great service and atmosphere!',
    'Wonderful experience, will visit again.',
    'Amazing place with friendly staff.',
    'Good quality products and reasonable prices.',
    'Highly recommended!'
  ];
  const randomReview = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];

  // Fill review
  await page.locator('[name="review"]').fill(randomReview);
  console.log(`📝 Review text: ${randomReview}`);

  // Handle rating
  const ratingElements = page.locator("#ratingBox li");
  const ratingCount = await ratingElements.count();

  if (ratingCount > 0) {
    // Random rating between 1 and ratingCount
    const randomRating = Math.floor(Math.random() * ratingCount) + 1;
    await ratingElements.nth(randomRating - 1).click();
    console.log(` Selected rating: ${randomRating} out of ${ratingCount}`);
  } else {
    console.log(' No rating elements found');
  }

  // Submit review
  await page.getByRole('button', { name: 'Submit' }).click();

  // Wait for success message or page update
  await page.waitForTimeout(2000); // Give time for submission

  console.log('✅ Review submitted successfully');
});