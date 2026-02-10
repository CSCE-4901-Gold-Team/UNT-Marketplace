import { test, expect } from '@playwright/test';

test('Has login inputs', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Forgot password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Don\'t have an account?' })).toBeVisible();
});

test('Can login', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="email"]').fill('test.user@my.unt.edu');
    await page.locator('input[name="password"]').fill('rootroot');

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('heading', { name: 'Login success!' })).toBeVisible();
    await expect(page).toHaveURL('/market');
});
