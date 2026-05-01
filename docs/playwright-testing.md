# Playwright Testing

E2E tests in `tests/`. Dev server must be running manually before tests.

## Configuration

- `baseURL` comes from `APP_URL` in `.env`
- Runs Chromium + Firefox. HTML reporter.
- 15s expect timeout. Retries only on CI.

## Running

```bash
npx playwright test --project=chromium          # Chromium only (faster)
npx playwright test tests/listing/              # Specific directory
npx playwright test tests/auth/login.spec.ts    # Single file
```

## Login Helper

`tests/helpers/auth.ts` provides `login(page, user)` and `logout(page)`.

**Important:** After login, the page redirects to `/` (home), NOT `/market`. The original helper expected `/market` which caused failures. The current helper accepts any authenticated route (`/market`, `/profile`, or `/`).

```ts
await login(page, "admin");   // admin@my.unt.edu / testtest
await login(page, "student"); // test.user@my.unt.edu / rootroot
```

## Server Health Check

`checkServerHealth(page)` loads `/market/create-listing` and checks for runtime error dialogs. Use in `beforeEach` to skip tests when the server has module errors (e.g., `sharp` not installed for the platform):

```ts
test.beforeEach(async ({ page }) => {
    if (!(await checkServerHealth(page))) {
        test.skip();
    }
});
```

## Category Dropdown Interaction

The `CategoryChipsInput` component uses a focus-triggered dropdown with `<button>` options. To select a category:

```ts
const input = page.locator('input[id="categoryIds"]');
await input.focus();          // Opens dropdown
await page.waitForTimeout(1000); // Wait for dropdown render
const option = page.locator('.shadow-xl button').first();
await option.click();
```

**Do not use `fill()` on the category input** — it clears the value but the dropdown may not re-render in time. Use `focus()` to open, then click a visible option button.

Use the `selectCategory(page)` helper from `tests/helpers/image-helper.ts` for a reliable implementation.

**Critical: Wait for the category input to be enabled before selecting.** The form disables the category input while categories are loading from the API (`isLoadingCategories` state). If you select a category before it's enabled, the selection won't persist and form submission will fail.

## Image Test Helpers

`tests/helpers/image-helper.ts` provides `createTestImageFile(path)` — writes a minimal valid 1x1 PNG to disk for file input testing.

## Profile Upload Tests

Profile image upload goes through `/api/profile/upload` with `multipart/form-data`. Test via Playwright's API context:

```ts
const response = await context.request.post(`${baseURL}/api/profile/upload`, {
    multipart: { file: { name: "test.png", mimeType: "image/png", buffer } },
});
```

Unauthenticated requests require a fresh browser context (no cookies):
```ts
const unauthContext = await browser.newContext();
const response = await unauthContext.request.post(url, { multipart: { ... } });
```

## Form Submission Timing

The create/edit listing form has async state that gates the submit button:
- `isLoadingCategories` &mdash; blocks submit while categories load from API
- `isLoadingData` &mdash; blocks submit while editing an existing listing
- `isPending` &mdash; blocks submit during form submission

**Always wait for the submit button to be enabled before clicking:**
```ts
const submitBtn = page.locator('form button[type="submit"]');
await expect(submitBtn).not.toBeDisabled({ timeout: 15000 });
await submitBtn.click();
```

**Don't use `page.waitForLoadState("networkidle")`** &mdash; it hangs due to Next.js HMR connections. Use explicit waits for UI elements instead.

After form submission, allow time for redirect then check the URL:
```ts
await page.waitForTimeout(5000);
const url = page.url();
expect(url).toMatch(/\/market\/listing\//);
```

## Delete Confirmation Flow

Deleting a listing is a two-step UI flow:
1. Click "Delete Listing" button to show confirmation dialog
2. Wait for "Confirm Delete" button to appear
3. Click "Confirm Delete"

```ts
await page.getByRole("button", { name: "Delete Listing" }).click();
await expect(page.getByRole("button", { name: "Confirm Delete" })).toBeVisible({ timeout: 10000 });
await page.getByRole("button", { name: "Confirm Delete" }).click();
```

## Seeded Data Cleanup

Use `seedTestListing()` from `tests/helpers/test-data.ts` to create test data. Always clean up in a `finally` block:

```ts
const { listingId, imagePaths } = await seedTestListing({ ownerId, title: "Test", categoryId });
try {
    // ... test logic ...
} finally {
    await cleanupTestListing(listingId, imagePaths);
}
```

The `cleanupTestListing` function checks if the listing still exists before deleting (it may have been deleted by the test itself).

## Parallelism Limits

The dev server can be overwhelmed by too many parallel test workers. Config is set to **4 workers** max. Don't increase this without testing server load first.

## Common Pitfalls

1. **Strict mode violations** — `page.locator('label')` resolves to multiple elements. Use specific selectors like `page.getByText("/5")` or `page.locator('label').first()`.
2. **Hidden inputs** — `toBeVisible()` fails on `type="hidden"` inputs. Use `toBeAttached()` instead.
3. **Form submit buttons** — `getByRole("button", { name: "Create Listing", exact: true })` can fail if the button text doesn't match exactly. `page.locator('form button[type="submit"]')` is more reliable.
4. **`test.skip()`** — takes no string argument in this Playwright version. Use `test.skip()` not `test.skip("reason")`.
5. **`.bg-green` is too broad** — matches both category chips and other green elements. Use `.bg-green.px-4` for category chips specifically.
6. **Form submission silently fails** — if categories aren't selected, the form stays on the same page with no visible error. Always verify redirect URL after submit.
