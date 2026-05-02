import { test, expect } from '@playwright/test';

test('Has registration inputs', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('input[name="first_name"]')).toBeVisible();
    await expect(page.locator('input[name="last_name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirm_password"]')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Already have an account?' })).toBeVisible();
});

test('Domain registration restriction', async ({ page }) => {
    await page.goto('/register');

    await page.locator('input[name="first_name"]').fill('Playwright');
    await page.locator('input[name="last_name"]').fill('NoReg');
    await page.locator('input[name="email"]').fill('test.user@non-unt.domain');
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirm_password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.locator('.Toastify__toast--error')).toBeVisible();
});

test.describe('User registration tests', () => {
    const testUuid = crypto.randomUUID(),
        testUserEmail = `${testUuid}@my.unt.edu`,
        testUserPassword = testUuid.substring(0, 12);

    test('Can register', async ({ page }) => {
        await page.goto('/register');

        await page.locator('input[name="first_name"]').fill('Playwright');
        await page.locator('input[name="last_name"]').fill('Reg');
        await page.locator('input[name="email"]').fill(testUserEmail);
        await page.locator('input[name="password"]').fill(testUserPassword);
        await page.locator('input[name="confirm_password"]').fill(testUserPassword);
        await page.getByRole('button', { name: 'Register' }).click();

        await expect(page.getByText('Registration successful!')).toBeVisible({ timeout: 30000 });
        await expect(page).toHaveURL('/login', { timeout: 30000 });
    });
});

