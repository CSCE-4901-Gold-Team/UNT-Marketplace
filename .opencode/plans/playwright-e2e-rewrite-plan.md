# Playwright E2E Test Rewrite Plan — COMPLETE

## Problem Statement

Several tests bypass the frontend UI by making direct API calls via `context.request.post()`, defeating the purpose of end-to-end testing. Additionally, some tests verify UI state without ever triggering the backend save logic through form submission.

---

## Changes Made

### 1. `tests/api/profile-upload-api.spec.ts` — **NEW FILE**

Moved direct API integration tests to a dedicated file:

| Test | Purpose |
|------|---------|
| `"profile upload endpoint requires authentication"` | Direct API call from unauthenticated context → expects 401 |
| `"profile upload rejects missing file"` | Direct API call with empty multipart → expects 400 |

These remain as integration tests since they validate API-level behavior not testable through the UI.

### 2. `tests/profile/image-upload.spec.ts` — **Full Rewrite**

Replaced all direct API calls with UI-based flows through `/profile`:

| Test | Flow |
|------|------|
| `"uploads profile image via file input and saves"` | Upload via file input → wait for toast → click Save → verify success toast and avatar image |
| `"profile image upload compresses to JPEG"` | Upload PNG → Save → reload `/profile` → verify `<img src>` ends with `.jpg` |
| `"unauthenticated user cannot access profile page"` | Navigate to `/profile` logged out → verify redirect to `/login` |
| `"profile page displays user info after login"` | Login → navigate to `/profile` → verify heading is visible |

### 3. `tests/helpers/image-helper.ts` — **Improved selectCategory**

Replaced fragile `waitForTimeout`-based category selection with element-based waiting:

```ts
// Before: waitForTimeout(2000) then try to find dropdown
// After:
await categoryInput.focus();
await expect(page.locator("div.shadow-xl").first()).toBeVisible({ timeout: 10000 });
await dropdown.locator("button").first().click();
```

Exported as a shared helper function used by all listing tests.

### 4. `tests/listing/image-upload.spec.ts` — **Persist Test Added**

| Test | Changes |
|------|---------|
| `"can create listing with images"` | Updated to use shared `selectCategory` helper |
| `"image upload component shows preview count"` | Added comment: valid UI-state test |
| `"can remove images before saving"` | Added comment: valid UI-state test |
| `"uploaded image persists after saving listing"` | **NEW** — replaced `removedImageUrls` test; full pipeline: upload → save → navigate to listing detail → verify image visible |

### 5. `tests/listing/image-edit.spec.ts` — **Persisted State Validation**

Added image count validation after each save by reloading the edit page:

| Test | Enhancement |
|------|-------------|
| `"create listing for subsequent edit tests"` | Updated to use shared `selectCategory` helper |
| `"can edit listing and remove an image"` | After save, reload edit page and verify image count decreased by 1 |
| `"can edit listing and add a new image"` | After save, reload edit page and verify image count increased by 1 |
| `"cleanup: delete the test listing"` | No changes needed |

---

## Decisions Made

1. **Auth test**: Kept direct API test for 401 in a separate `tests/api/` file. UI test verifies `/profile` redirect to `/login` for unauthenticated users.

2. **Edit test verification**: After save, reload the edit page (`/market/create-listing?edit=true&id={id}`) and count `img[alt*='Preview']` elements. This verifies persisted state without needing to parse the listing detail page's different image rendering.

3. **Category dropdown**: Replaced all `waitForTimeout` calls with `expect(element).toBeVisible({ timeout: 10000 })` for reliable element-based waiting.

---

## Files Modified

| File | Status |
|------|--------|
| `tests/api/profile-upload-api.spec.ts` | **Created** — 2 API integration tests |
| `tests/profile/image-upload.spec.ts` | **Rewritten** — 4 UI-based tests |
| `tests/helpers/image-helper.ts` | **Updated** — added shared `selectCategory` helper |
| `tests/listing/image-upload.spec.ts` | **Updated** — new persist test, updated imports |
| `tests/listing/image-edit.spec.ts` | **Updated** — added persisted state validation |
