import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth";
import { createTestImageFile, selectCategory } from "../helpers/image-helper";

test.describe("Listing Image Upload", () => {
    test("can create listing with images", async ({ page }) => {
        test.slow();
        await login(page, "admin");

        const testImagePath = createTestImageFile("public/uploads/test-listing-image.png");

        await page.goto("/market/create-listing");

        // Wait for the form to be fully loaded (categories loaded)
        await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 });

        await page.locator('input[name="title"]').fill("Test Listing with Images");
        await page.locator('input[name="description"]').fill(
            "This is a test listing with image upload functionality for E2E testing",
        );
        await page.locator('input[name="price"]').fill("29.99");

        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(testImagePath);

        await expect(page.locator("img[alt*='Preview']")).toBeVisible({ timeout: 15000 });

        // Wait for category input to be enabled (categories loaded)
        await expect(page.locator('input[id="categoryIds"]')).toBeEnabled({ timeout: 30000 });

        await selectCategory(page);

        // Wait for category chip to appear confirming selection persisted
        await expect(page.locator('.bg-green.px-4').first()).toBeVisible({ timeout: 10000 });

        // Wait for submit button to be enabled (categories must be loaded)
        const submitBtn = page.locator('form button[type="submit"]');
        await expect(submitBtn).not.toBeDisabled({ timeout: 15000 });

        await submitBtn.click();

        // Wait for either redirect or error
        await page.waitForTimeout(5000);
        const currentUrl = page.url();
        if (!currentUrl.match(/\/market\/listing\//)) {
            // Check for any error indicators
            const errorText = await page.locator('p.text-red-600').first().textContent().catch(() => null);
            const toastText = await page.locator('[role="alert"]').first().textContent().catch(() => null);
            throw new Error(
                `Form submission failed. URL: ${currentUrl}, Validation error: ${errorText || "none"}, Toast: ${toastText || "none"}`
            );
        }

        await logout(page);
    });

    // UI-state test: verifies client-side preview count without backend save
    test("image upload component shows preview count", async ({ page }) => {
        await login(page, "admin");

        const testImagePath = createTestImageFile("public/uploads/test-count-image.png");

        await page.goto("/market/create-listing");

        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(testImagePath);

        await expect(page.locator("img[alt*='Preview']")).toBeVisible({ timeout: 10000 });

        await expect(page.getByText("/5")).toBeVisible({ timeout: 5000 });

        await logout(page);
    });

    // UI-state test: verifies client-side image removal without backend save
    test("can remove images before saving", async ({ page }) => {
        await login(page, "admin");

        const testImagePath = createTestImageFile("public/uploads/test-remove-image.png");

        await page.goto("/market/create-listing");

        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(testImagePath);

        await expect(page.locator("img[alt*='Preview']")).toBeVisible({ timeout: 10000 });

        const beforeCount = await page.locator("img[alt*='Preview']").count();

        const removeBtn = page.locator("button.bg-red-500").first();
        if (await removeBtn.isVisible().catch(() => false)) {
            await removeBtn.click();
        } else {
            await page.locator("button").filter({ has: page.locator("svg") }).first().click();
        }

        await expect(page.locator("img[alt*='Preview']")).toHaveCount(beforeCount - 1, {
            timeout: 5000,
        });

        await logout(page);
    });

    // Full pipeline test: upload image, save listing, verify image persists on listing detail page
    test("uploaded image persists after saving listing", async ({ page }) => {
        test.slow();

        await login(page, "admin");

        const testImagePath = createTestImageFile("public/uploads/test-persist-image.png");

        await page.goto("/market/create-listing");

        // Wait for form to load
        await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 });

        await page.locator('input[name="title"]').fill("Persist Test Listing");
        await page.locator('input[name="description"]').fill("Testing image persistence");
        await page.locator('input[name="price"]').fill("19.99");

        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(testImagePath);

        await expect(page.locator("img[alt*='Preview']")).toBeVisible({ timeout: 15000 });

        // Wait for category input to be enabled (categories loaded)
        await expect(page.locator('input[id="categoryIds"]')).toBeEnabled({ timeout: 30000 });

        await selectCategory(page);

        // Wait for category chip to appear
        await expect(page.locator('.bg-green.px-4').first()).toBeVisible({ timeout: 10000 });

        // Wait for submit button to be enabled
        const submitBtn = page.locator('form button[type="submit"]');
        await expect(submitBtn).not.toBeDisabled({ timeout: 15000 });

        await submitBtn.click();

        // Wait for redirect
        await page.waitForTimeout(5000);
        const url = page.url();
        const match = url.match(/\/market\/listing\/([^?/]+)/);
        if (!match) {
            const errorText = await page.locator('p.text-red-600').first().textContent().catch(() => null);
            throw new Error(
                `Form submission failed. URL: ${url}, Validation error: ${errorText || "none"}`
            );
        }
        const listingId = match[1];

        await page.goto(`/market/listing/${listingId}`);

        await expect(page.locator('img[alt*="Listing"]')).toBeVisible({ timeout: 10000 });

        await logout(page);
    });
});
