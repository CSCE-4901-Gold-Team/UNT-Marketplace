import { test, expect } from '@playwright/test';

test('Has forgot password inputs', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: 'Reset Your Password' })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    await expect(page.getByRole('link', { name: 'Back to login' })).toBeVisible();
});
