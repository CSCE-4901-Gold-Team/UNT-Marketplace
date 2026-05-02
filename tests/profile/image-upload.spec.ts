import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth";
import { createTestImageFile } from "../helpers/image-helper";

test.describe("Profile Image Upload", () => {
    test("uploads profile image via file input and saves", async ({ page }) => {
        await login(page, "student");

        await page.goto("/profile");

        await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({ timeout: 10000 });

        const testImagePath = createTestImageFile("public/uploads/profile-ui-image.png");
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(testImagePath);

        await expect(page.getByText("Image uploaded")).toBeVisible({ timeout: 10000 });

        await page.getByRole("button", { name: "Save", exact: true }).click();

        await expect(page.getByText("Profile updated successfully")).toBeVisible({ timeout: 10000 });

        const avatarImg = page.locator('img[class*="rounded-full"]').first();
        await expect(avatarImg).toBeVisible({ timeout: 10000 });

        await logout(page);
    });

    test("profile image upload compresses to JPEG", async ({ page }) => {
        await login(page, "student");

        await page.goto("/profile");

        const testImagePath = createTestImageFile("public/uploads/profile-jpeg-test.png");
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(testImagePath);

        await expect(page.getByText("Image uploaded")).toBeVisible({ timeout: 10000 });

        await page.getByRole("button", { name: "Save", exact: true }).click();
        await expect(page.getByText("Profile updated successfully")).toBeVisible({ timeout: 10000 });

        await page.goto("/profile");

        const avatarImg = page.locator('img[class*="rounded-full"]').first();
        const imgSrc = await avatarImg.getAttribute("src");
        expect(imgSrc).toMatch(/\.jpg$/);

        await logout(page);
    });

    test("unauthenticated user cannot access profile page", async ({ page }) => {
        await page.goto("/profile");

        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test("profile page displays user info after login", async ({ page }) => {
        await login(page, "student");

        await page.goto("/profile");

        await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({ timeout: 10000 });

        await logout(page);
    });
});
