import { expect, Page } from "@playwright/test";

export const TestUsers = {
    admin: {
        email: "admin@my.unt.edu",
        password: "testtest",
    },
    student: {
        email: "test.user@my.unt.edu",
        password: "rootroot",
    },
} as const;

export async function login(page: Page, user: "admin" | "student" = "admin"): Promise<void> {
    const credentials = TestUsers[user];

    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 });

    await page.locator('input[name="email"]').fill(credentials.email);
    await page.locator('input[name="password"]').fill(credentials.password);
    await page.getByRole("button", { name: "Login" }).click();

    // Wait for redirect to any authenticated page
    await expect(page).toHaveURL(/\/(market|profile|$)/, { timeout: 30000 });
}

export async function logout(page: Page): Promise<void> {
    await page.goto("/logout", { timeout: 30000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
}
