const { test, expect } = require('@playwright/test');
const users = require('./testdata/json/all-users.json');
const reviewJson = require('./testdata/json/review.json');

const APP_URL = 'https://d2025.weavers-web.com/login';

test.describe.configure({ mode: 'serial' });

users.forEach(user => {

    test(`Submit review → ${user.username}`, async ({ page }) => {

        test.setTimeout(90000);

        console.log(`👤 User: ${user.username}`);

        // ✅ LOGIN
        await page.goto(APP_URL);
        await page.getByRole('textbox', { name: 'Enter Your Username' }).fill(user.username);
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(user.password);
        await page.getByRole('button', { name: 'Log In' }).click();

        await page.waitForLoadState('networkidle');

        // ✅ Click "See More" to navigate to shops page
        const seeMoreLink = page.locator('a').filter({ hasText: 'See More' }).last();
        await seeMoreLink.waitFor({ state: 'visible', timeout: 10000 });
        await seeMoreLink.click();

        await page.waitForLoadState('networkidle');

        // ✅ Wait for slider items to be in DOM (attached), not visible
        // ✅ ONLY visible shops (slick fix)
        const shopsLocator = page.locator('.single-item-item.slick-active[aria-hidden="false"]');

        // wait for visible items
        await expect(shopsLocator.first()).toBeVisible({ timeout: 15000 });

        const shopCount = await shopsLocator.count();

        if (shopCount === 0) {
            throw new Error('❌ No visible shops found');
        }

        // random visible shop
        const randomShopIndex = Math.floor(Math.random() * shopCount);
        const shop = shopsLocator.nth(randomShopIndex);

        // 🛑 pause slider (important for slick)
        await shop.hover();

        // ✅ safe click with navigation wait
        await Promise.all([
            page.waitForLoadState('networkidle'),
            shop.click({ force: true })
        ]);

        // ✅ SAFE RANDOM CLICK on shop title
        let clicked = false;

        for (let i = 0; i < 100; i++) {
            try {
                const shops = page.locator('.single-item-item.slick-active[aria-hidden="false"]');
                const count = await shops.count();

                const randomIndex = Math.floor(Math.random() * count);
                const shop = shops.nth(randomIndex);

                await shop.scrollIntoViewIfNeeded();
                await shop.click();

                await page.waitForLoadState('networkidle');

                clicked = true;
                break;

            } catch (err) {
                console.warn(`⚠️ Retry (${i + 1}/3): ${err.message}`);

                // ✅ check if page still alive
                if (page.isClosed()) {
                    throw new Error('❌ Page closed unexpectedly');
                }

                await page.waitForTimeout(1000);
            }
        }

        if (!clicked) {
            throw new Error('❌ Failed to click shop');
        }

        // ✅ WAIT AFTER NAVIGATION TO SHOP PAGE
        await page.waitForLoadState('networkidle');

        // ✅ GET RANDOM REVIEW FROM JSON
        const reviews = reviewJson.reviewData;

        if (!reviews || reviews.length === 0) {
            throw new Error('❌ No reviews found in JSON');
        }

        const randomReview = reviews[Math.floor(Math.random() * reviews.length)].review;

        await page.locator('[name="review"]').fill(randomReview);
        console.log(`📝 Review: ${randomReview.substring(0, 50)}...`);

        // ✅ RANDOM RATING
        const stars = page.locator('#ratingBox li');
        const starCount = await stars.count();

        if (starCount > 0) {
            const randomRating = Math.floor(Math.random() * starCount);
            await stars.nth(randomRating).click();
            console.log(`⭐ Rating: ${randomRating + 1}`);
        }

        // ✅ SUBMIT REVIEW
        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(2000);

        console.log(`✅ Review submitted by ${user.username}`);
        await page.getByRole('button', { name: 'OK' }).click();
        await page.getByRole('button', { name: 'My Account' }).click();
        await page.getByRole('link', { name: 'Log Out' }).click();
        await page.getByRole('button', { name: 'Yes, Logout' }).click();

    });





});