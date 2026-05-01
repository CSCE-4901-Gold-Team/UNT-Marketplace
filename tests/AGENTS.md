# Tests Directory - Agent Instructions

## Test-Writing Constraints

- **No bypassing the frontend UI** — tests must interact with the application through the UI as a real user would. Do not call server actions or API routes directly unless testing the API endpoint itself.
- **Seed data is allowed** — use `helpers/test-data.ts` to seed entities for tests, but always clean them up in a `finally` block.
- **Validate tests as you go** — run tests incrementally after each change, not just at the end.
- **Playwright is installed and the dev server runs at `http://169.254.83.107:3000/`** (check `APP_URL` in `.env`).

## Test Structure

```
tests/
├── helpers/
│   ├── auth.ts          # login(), logout(), TestUsers
│   ├── image-helper.ts  # createTestImageFile(), selectCategory()
│   └── test-data.ts     # seedTestListing(), cleanupTestListing(), getAdminUserId(), getFirstCategoryId()
├── auth/                # Login, registration, password reset tests
├── api/                 # API endpoint integration tests
├── listing/             # Listing CRUD and image tests
└── profile/             # Profile image upload tests
```

## Helpers Reference

### `helpers/auth.ts`
- `login(page, user)` — Logs in via UI. `user` is `"admin"` or `"student"`. Waits for redirect to authenticated page.
- `logout(page)` — Navigates to `/logout`, waits for redirect to `/login`.
- `TestUsers` — Object with admin/student credentials.

### `helpers/image-helper.ts`
- `createTestImageFile(path)` — Writes a minimal valid 1x1 PNG to disk. Returns the path.
- `selectCategory(page)` — Focuses category input, waits for dropdown, clicks first option, closes dropdown.

### `helpers/test-data.ts`
- `seedTestListing({ ownerId, title, description, price, numImages, categoryId })` — Creates a listing via Prisma with images on disk.
- `cleanupTestListing(listingId, imagePaths)` — Deletes listing and disk files. Checks if listing exists first.
- `getAdminUserId()` — Returns the admin user's ID from DB.
- `getFirstCategoryId()` — Returns the first category ID from DB.

## Timing Patterns

### Waiting for form readiness
```ts
// Wait for title input (form loaded)
await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 });

// Wait for category input enabled (categories loaded from API)
await expect(page.locator('input[id="categoryIds"]')).toBeEnabled({ timeout: 30000 });

// Wait for submit button enabled
const submitBtn = page.locator('form button[type="submit"]');
await expect(submitBtn).not.toBeDisabled({ timeout: 15000 });
```

### After form submission
```ts
await submitBtn.click();
await page.waitForTimeout(5000);
const url = page.url();
expect(url).toMatch(/\/market\/listing\//);
```

### Delete confirmation
```ts
await page.getByRole("button", { name: "Delete Listing" }).click();
await expect(page.getByRole("button", { name: "Confirm Delete" })).toBeVisible({ timeout: 10000 });
await page.getByRole("button", { name: "Confirm Delete" }).click();
```

## Anti-Patterns (Don't Do This)

- `page.waitForLoadState("networkidle")` — hangs due to Next.js HMR connections
- `.bg-green` selector — too broad, use `.bg-green.px-4` for category chips
- `fill()` on category input — clears value but dropdown may not re-render
- Calling server actions directly from tests — bypasses UI, violates constraints
- Forgetting `finally` cleanup blocks — leaves orphaned test data in DB

## Running Tests

```bash
npx playwright test --project=chromium          # Chromium only (faster)
npx playwright test tests/listing/              # Specific directory
npx playwright test tests/auth/login.spec.ts    # Single file
npx playwright test --project=chromium --project=firefox  # Both browsers
```
