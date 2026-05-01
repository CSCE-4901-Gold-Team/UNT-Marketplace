import { test, expect } from '@playwright/test';

test.describe('Accessibility: Login page', () => {
    test('form inputs have associated labels', async ({ page }) => {
        await page.goto('/login');

        // Every input should have an accessible label tied to it.
        // getByLabel() uses the <label> text to locate the input, so if the
        // association is missing the locator will not find the element.
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Password');

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();

        // The submit button must be reachable by its accessible name so that
        // screen-reader users can identify it without inspecting the DOM.
        const submitButton = page.getByRole('button', { name: 'Login' });
        await expect(submitButton).toBeVisible();
    });

    test('page has a single top-level heading', async ({ page }) => {
        await page.goto('/login');

        // There should be exactly one <h1> on the page so assistive
        // technologies can quickly identify the page topic.
        const headings = page.getByRole('heading', { level: 1 });
        await expect(headings).toHaveCount(1);
        await expect(headings).toHaveText('Login');
    });
});

test.describe('Accessibility: Register page', () => {
    test('form inputs have associated labels', async ({ page }) => {
        await page.goto('/register');

        // Check every registration field is reachable by its visible label
        // text — the primary requirement for screen-reader compatibility.
        await expect(page.getByLabel('First Name')).toBeVisible();
        await expect(page.getByLabel('Last Name')).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByLabel('Confirm Password')).toBeVisible();

        // The submit button must also carry an accessible name.
        await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
    });

    test('page has a single top-level heading', async ({ page }) => {
        await page.goto('/register');

        // A single <h1> gives screen-reader users a clear landmark for the
        // purpose of the page.
        const headings = page.getByRole('heading', { level: 1 });
        await expect(headings).toHaveCount(1);
        await expect(headings).toHaveText('Create Your Account');
    });
});
