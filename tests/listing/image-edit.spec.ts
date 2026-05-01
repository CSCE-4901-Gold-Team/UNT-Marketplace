import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth";
import { createTestImageFile } from "../helpers/image-helper";
import {
    seedTestListing,
    cleanupTestListing,
    getAdminUserId,
    getFirstCategoryId,
} from "../helpers/test-data";

test.describe("Listing Image Edit", () => {
    test("can edit listing and remove an image", async ({ page }) => {
        test.setTimeout(60000);

        const ownerId = await getAdminUserId();
        const categoryId = await getFirstCategoryId();
        const { listingId, imagePaths } = await seedTestListing({
            ownerId,
            title: "Edit Remove Target",
            numImages: 2,
            categoryId,
        });

        try {
            await login(page, "admin");

            await page.goto(`/market/create-listing?edit=true&id=${listingId}`);

            // Wait for listing data to load
            await expect(page.locator("img[alt*='Preview']").first()).toBeVisible({ timeout: 15000 });

            const initialCount = await page.locator("img[alt*='Preview']").count();
            expect(initialCount).toBe(2);

            const removeBtn = page.locator("button.bg-red-500").first();
            await removeBtn.click();

            await expect(page.locator("img[alt*='Preview']")).toHaveCount(initialCount - 1, {
                timeout: 5000,
            });

            const removedUrlsValue = await page.locator('input[name="removedImageUrls"]').inputValue();
            const removedUrls = JSON.parse(removedUrlsValue || "[]");
            expect(removedUrls.length).toBeGreaterThan(0);

            // Brief pause to ensure React hidden inputs are synced
            await page.waitForTimeout(500);

            await page.getByRole("button", { name: "Update Listing", exact: true }).click();
            await expect(page).toHaveURL(/\/market\/listing\/.*\?updated=true/, {
                timeout: 20000,
            });

            // Reload edit page to verify persisted image count
            await page.goto(`/market/create-listing?edit=true&id=${listingId}`, { waitUntil: "networkidle" });

            const afterCount = await page.locator("img[alt*='Preview']").count();
            expect(afterCount).toBe(initialCount - 1);

            await logout(page);
        } finally {
            await cleanupTestListing(listingId, imagePaths);
        }
    });

    test("can edit listing and add a new image", async ({ page }) => {
        test.setTimeout(60000);

        const ownerId = await getAdminUserId();
        const categoryId = await getFirstCategoryId();
        const { listingId, imagePaths } = await seedTestListing({
            ownerId,
            title: "Edit Add Target",
            numImages: 1,
            categoryId,
        });

        try {
            await login(page, "admin");

            await page.goto(`/market/create-listing?edit=true&id=${listingId}`);

            // Wait for listing data to load
            await expect(page.locator("img[alt*='Preview']")).toBeVisible({ timeout: 15000 });

            const beforeCount = await page.locator("img[alt*='Preview']").count();

            const newImagePath = createTestImageFile("public/uploads/edit-add-image.png");
            const fileInput = page.locator('input[type="file"]').first();
            await fileInput.setInputFiles(newImagePath);

            await expect(page.locator("img[alt*='Preview']")).toHaveCount(beforeCount + 1, {
                timeout: 10000,
            });

            // Brief pause to ensure React hidden inputs are synced
            await page.waitForTimeout(500);

            await page.getByRole("button", { name: "Update Listing", exact: true }).click();
            await expect(page).toHaveURL(/\/market\/listing\/.*\?updated=true/, {
                timeout: 20000,
            });

            // Reload edit page to verify persisted image count
            await page.goto(`/market/create-listing?edit=true&id=${listingId}`, { waitUntil: "networkidle" });

            const afterCount = await page.locator("img[alt*='Preview']").count();
            expect(afterCount).toBe(beforeCount + 1);

            await logout(page);
        } finally {
            await cleanupTestListing(listingId, imagePaths);
        }
    });

    test("can delete a listing", async ({ page }) => {
        test.setTimeout(60000);
        const ownerId = await getAdminUserId();
        const categoryId = await getFirstCategoryId();
        const { listingId, imagePaths } = await seedTestListing({
            ownerId,
            title: "Delete Target",
            numImages: 1,
            categoryId,
        });

        try {
            await login(page, "admin");

            await page.goto(`/market/create-listing?edit=true&id=${listingId}`);

            // Wait for listing data to load
            await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 });

            // Click the delete button to show confirmation dialog
            await page.getByRole("button", { name: "Delete Listing" }).click();

            // Wait for the confirmation dialog to appear before clicking confirm
            await expect(page.getByRole("button", { name: "Confirm Delete" })).toBeVisible({
                timeout: 10000,
            });

            await page.getByRole("button", { name: "Confirm Delete" }).click();

            // Wait for redirect to market page with deleted=true
            await expect(page).toHaveURL(/\/market\?deleted=true/, { timeout: 20000 });

            await logout(page);
        } finally {
            await cleanupTestListing(listingId, imagePaths);
        }
    });
});
