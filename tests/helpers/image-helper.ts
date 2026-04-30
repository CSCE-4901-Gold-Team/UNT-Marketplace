import fs from "fs";
import { Page, expect } from "@playwright/test";

export function createTestImageFile(path: string): string {
    const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
    );
    fs.writeFileSync(path, pngBuffer);
    return path;
}

/**
 * Selects the first available category from the dropdown.
 * Uses element-based waiting instead of timeouts for reliability.
 */
export async function selectCategory(page: Page): Promise<void> {
    const categoryInput = page.locator('input[id="categoryIds"]');
    await expect(categoryInput).toBeVisible({ timeout: 10000 });

    await categoryInput.focus();

    const dropdown = page.locator("div.shadow-xl").first();
    await expect(dropdown).toBeVisible({ timeout: 10000 });

    const firstOption = dropdown.locator("button").first();
    await firstOption.click();

    // Close the dropdown so it doesn't intercept subsequent clicks
    await categoryInput.press("Escape");
}
