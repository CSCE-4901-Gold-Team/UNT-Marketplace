import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth";
import { createTestImageFile } from "../helpers/image-helper";
import fs from "fs";

test.describe("Profile Upload API Integration", () => {
    test("profile upload endpoint requires authentication", async ({ browser }) => {
        const testImagePath = createTestImageFile("public/uploads/unauth-image.png");
        const buffer = fs.readFileSync(testImagePath);

        const baseURL = process.env.APP_URL || "http://169.254.83.107:3000";

        const unauthContext = await browser.newContext();
        const response = await unauthContext.request.post(`${baseURL}/api/profile/upload`, {
            multipart: {
                file: {
                    name: "test.png",
                    mimeType: "image/png",
                    buffer,
                },
            },
        });

        expect(response.status()).toBe(401);
        await unauthContext.close();
    });

    test("profile upload rejects missing file", async ({ page }) => {
        await login(page, "student");

        const baseURL = process.env.APP_URL || "http://169.254.83.107:3000";
        const context = page.context();

        const response = await context.request.post(`${baseURL}/api/profile/upload`, {
            multipart: {},
        });

        expect(response.status()).toBe(400);

        await logout(page);
    });
});
