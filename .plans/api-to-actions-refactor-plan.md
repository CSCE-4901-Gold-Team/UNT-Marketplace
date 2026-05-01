# API-to-Actions Refactor Plan

## Goal
Convert API endpoints to Next.js server actions where possible, with minimal to no change in functionality. Endpoints that must remain as API routes will be kept.

---

## API Endpoint Inventory

| # | Endpoint | Methods | Used By | Decision | Notes |
|---|----------|---------|---------|----------|-------|
| 1 | `/api/auth/[...all]` | GET, POST | better-auth library | **KEEP** | Auth library handler — cannot be an action |
| 2 | `/api/cron/process-saved-queries` | GET | Vercel Cron (`vercel.json`) | **KEEP** | Cron jobs require HTTP endpoints |
| 3 | `/api/user-role` | GET | `create-listing/page.tsx:138` | **CONVERT** | Action already exists: `getCurrentUserRole()` |
| 4 | `/api/saved-queries` | GET, POST | **Nowhere** (dead code) | **DELETE** | Actions exist, frontend already uses them |
| 5 | `/api/saved-queries/[id]` | GET, PATCH, DELETE | **Nowhere** (dead code) | **DELETE** | Actions exist, frontend already uses them |
| 6 | `/api/listing/[id]` | GET | `create-listing/page.tsx:102` | **CONVERT** | Create `getListById()` in `listing-actions.ts` |
| 7 | `/api/profile` | PATCH | `ProfileEditor.tsx:25` | **CONVERT** | Create `updateProfile()` in new `profile-actions.ts` |
| 8 | `/api/profile/upload` | POST (FormData) | `ProfileEditor.tsx:52`, e2e tests | **CONVERT** | Base64 approach (consistent with listing uploads) |

---

## Detailed Conversion Plan

### Phase 1: Remove Dead Code (Low Risk)

**Endpoints**: `/api/saved-queries`, `/api/saved-queries/[id]`

**Rationale**: These endpoints are not consumed by any frontend code. The `SavedQueriesManager.tsx` component already imports and uses the equivalent server actions from `@/actions/saved-query-actions`. The API routes are dead code.

**Actions**:
1. Delete `src/app/api/saved-queries/route.ts`
2. Delete `src/app/api/saved-queries/[id]/route.ts`
3. Delete the `src/app/api/saved-queries/` directory if empty

**Risk**: Minimal — no frontend consumers.

---

### Phase 2: Convert `/api/user-role` GET (Low Risk)

**Consumer**: `src/app/market/create-listing/page.tsx:138`

**Current code**:
```typescript
fetch("/api/user-role")
    .then((res) => res.ok ? res.json() : Promise.reject(new Error("Failed to load role")))
    .then((data) => setUserRole(data?.role ?? null))
    .catch(() => setUserRole(null));
```

**Existing action**: `getCurrentUserRole()` in `src/actions/user-actions.ts:16` returns `Promise<$Enums.UserRole>` (string: `"STUDENT"`, `"FACULTY"`, or `"ADMIN"`).

**Difference**: The API returns `{ role: string | null }` and returns 401 when unauthenticated. The action calls `redirect("/sign-in")` when unauthenticated.

**Conversion**:
- Replace the `fetch()` call with `getCurrentUserRole()` call
- Wrap in try/catch to handle the redirect behavior difference
- The action will redirect unauthenticated users (acceptable — they shouldn't be on the create listing page anyway)

**Files to modify**: `src/app/market/create-listing/page.tsx`

**After conversion**, the `/api/user-role` endpoint will have zero consumers and can be deleted.

---

### Phase 3: Convert `/api/listing/[id]` GET (Medium Risk)

**Consumer**: `src/app/market/create-listing/page.tsx:102`

**Current code**:
```typescript
fetch(`/api/listing/${listingId}`)
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then((data: ListingResponse) => { ... populate form fields ... })
```

**API logic** (`src/app/api/listing/[id]/route.ts`):
1. Fetch listing by ID with categories and images
2. Check if listing exists (404 if not)
3. If `isProfessorOnly` and user is STUDENT → 403
4. If `DRAFT` and not owner → 404
5. Return listing data

**New action**: `getListById(id: string)` in `src/actions/listing-actions.ts`

**Justification for coexistence with `getListings()`**: `getListings()` returns a paginated, filtered list of listings. `getListById()` returns a single listing by ID with access control checks (professor-only, draft ownership). Different purpose, different query patterns, different return shapes.

**Return type**:
```typescript
{
    success: boolean;
    listing?: {
        id: string;
        title: string;
        description: string;
        price: string;  // Decimal as string
        listingStatus: string;
        isProfessorOnly: boolean;
        categories: { id: number; name: string }[];
        images: { url: string }[];
    };
    error?: string;
}
```

**Error handling**: Return `{ success: false, error: string }` pattern to match the frontend's try/catch pattern.

**Files to modify**:
- MODIFY: `src/actions/listing-actions.ts` — add `getListById()`
- MODIFY: `src/app/market/create-listing/page.tsx` — replace fetch with action call

**After conversion**, the `/api/listing/[id]` endpoint will have zero consumers and can be deleted.

---

### Phase 4: Convert `/api/profile` PATCH (Medium Risk)

**Consumer**: `src/components/profile/ProfileEditor.tsx:25`

**Current code**:
```typescript
const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), image: image.trim() || null }),
});
const data = await res.json();
```

**API logic** (`src/app/api/profile/route.ts`):
1. Validate session
2. Parse `{ name, image }` from JSON body
3. Validate name
4. Fetch existing user image for cleanup
5. Update user (name + image)
6. Delete old profile image file if it was a local upload and changed
7. Return `{ success: true, user: updated }`

**New action**: `updateProfile(name: string, image: string | null)` in new `src/actions/profile-actions.ts`

**Implementation note**: The `imageAdapter.setProfileImage()` method already handles the image update + old file cleanup logic. The action can delegate to it.

**Return type**: `{ success: boolean; user?: { id: string; name: string; email: string; image: string | null }; error?: string }`

**Files to modify**:
- CREATE: `src/actions/profile-actions.ts` — add `updateProfile()` and `uploadProfileImage()`
- MODIFY: `src/components/profile/ProfileEditor.tsx` — replace fetch with action call

**After conversion**, the `/api/profile` endpoint will have zero consumers and can be deleted.

---

### Phase 5: Convert `/api/profile/upload` POST (Medium Risk)

**Consumers**: `src/components/profile/ProfileEditor.tsx:52`, `tests/api/profile-upload-api.spec.ts`

**Current code**:
```typescript
const fd = new FormData();
fd.append("file", file);
const res = await fetch("/api/profile/upload", {
    method: "POST",
    body: fd,
});
```

**API logic** (`src/app/api/profile/upload/route.ts`):
1. Validate session
2. Parse FormData, extract `file`
3. Convert file to buffer
4. Call `imageAdapter.saveFromBuffer(buffer, fileName, { type: "profile" })`
5. Return `{ success: true, url: string }`

**Approach: Base64 (consistent with listing image uploads)**

The listing image upload flow already uses base64:
1. Client converts file to base64 data URL (with client-side compression via canvas)
2. Submits base64 via hidden form field
3. Server action receives base64, calls `imageAdapter.saveFromBase64(b64, { type: "listing" })`

For profile upload, follow the same pattern:
1. Client converts file to base64 (no canvas compression needed — single file, smaller)
2. Call server action with base64 string
3. Server action calls `imageAdapter.saveFromBase64(base64String, { type: "profile" })`
4. Return `{ success: true, url: string }`

**New action**: `uploadProfileImage(base64String: string)` in `src/actions/profile-actions.ts`

**Client change in `ProfileEditor.tsx`**: Replace the FormData fetch with:
```typescript
// Convert file to base64
const reader = new FileReader();
reader.onload = async () => {
    const base64 = reader.result as string;
    const result = await uploadProfileImage(base64);
    if (result.success) setImage(result.url);
};
reader.readAsDataURL(file);
```

**Files to modify**:
- CREATE: `src/actions/profile-actions.ts` — add `uploadProfileImage()` alongside `updateProfile()`
- MODIFY: `src/components/profile/ProfileEditor.tsx` — replace FormData fetch with base64 + action call
- MODIFY: `tests/api/profile-upload-api.spec.ts` — rewrite as UI-based test (see below)

**After conversion**, the `/api/profile/upload` endpoint will have zero consumers and can be deleted.

---

### Phase 5b: Update E2E Tests (tests/profile/image-upload.spec.ts)

**Current test file**: `tests/profile/image-upload.spec.ts`

**Existing coverage**:
| Scenario | Covered? |
|----------|----------|
| Upload (first-time) + save | ✅ |
| Compression (PNG→JPEG) | ✅ |
| Auth redirect (unauthenticated) | ✅ |
| Profile page display | ✅ |
| **Update (replace existing image)** | ❌ |
| **Remove (clear image, save null)** | ❌ |

**Two new tests to add**:

1. **"replacing profile image removes old file"** — Upload image A, save, verify avatar. Upload image B, save, verify avatar shows new image. Verify old image file path no longer appears in avatar `src` attribute.

2. **"removing profile image clears avatar"** — Upload image, save, verify avatar shows image. Clear the "Profile image URL" input field, click Save, verify avatar reverts to initials fallback div (the `div` with `rounded-full bg-gray-200` class instead of `<img>`).

**Implementation details**:
- Both tests follow existing patterns in the file (login → goto `/profile` → interact → verify → logout)
- Use `createTestImageFile()` for test images
- Clear the URL input with `page.locator('input[placeholder="https://..."]').fill("")`
- Verify initials fallback with `page.locator('div[class*="rounded-full"][class*="bg-gray-200"]').first()`

**Also delete**: `tests/api/profile-upload-api.spec.ts` entirely — its two test cases (auth check, missing file) are already covered by existing UI tests. Auth by `tests/profile/image-upload.spec.ts:52` (redirect test). Missing file is a client-side no-op (`if (!file) return`) that doesn't need server testing.

**Files to modify**:
- MODIFY: `tests/profile/image-upload.spec.ts` — add 2 new tests
- DELETE: `tests/api/profile-upload-api.spec.ts`

---

## Endpoints That Remain as API Routes

| Endpoint | Reason |
|----------|--------|
| `/api/auth/[...all]` | better-auth library handler — not user code |
| `/api/cron/process-saved-queries` | Vercel Cron requires HTTP endpoint |

---

## Implementation Order

1. **Phase 1**: Remove dead saved-queries API routes (zero risk, quick win)
2. **Phase 2**: Convert `/api/user-role` → use existing `getCurrentUserRole()` action, then delete endpoint
3. **Phase 3**: Create `getListById()` in `listing-actions.ts`, convert `/api/listing/[id]`, then delete endpoint
4. **Phase 4**: Create `updateProfile()` in new `profile-actions.ts`, convert `/api/profile`, then delete endpoint
5. **Phase 5**: Create `uploadProfileImage()` in `profile-actions.ts`, convert `/api/profile/upload`, then delete endpoint
6. **Phase 5b**: Add 2 new UI tests to `tests/profile/image-upload.spec.ts` (replace image, remove image), then delete `tests/api/profile-upload-api.spec.ts`

---

## Testing Strategy

After each phase:
1. Run `npm run lint` to check for errors
2. Manually verify the affected page/component still works
3. Run relevant Playwright e2e tests: `npx playwright test --project=chromium`

Existing tests that validate coverage:
- `tests/profile/image-upload.spec.ts` — full profile upload flow via UI
- `tests/listing/image-upload.spec.ts` — listing image upload via UI
- `tests/listing/image-edit.spec.ts` — listing edit flow (uses the listing fetch we're converting)

---

## Future TODO (Noted, Not Implemented)

**Action return pattern inconsistency**: Existing actions use different return patterns:
- `getCurrentUserRole()` — returns raw `$Enums.UserRole` string, redirects on auth failure
- `getListings()` — returns `ListingObject[]`, redirects on auth failure
- `saved-query-actions` — return `{ success: boolean, ... }` pattern, error objects on auth failure
- `listing-create.ts` — returns `FormResponse` with `FormStatus` enum

This inconsistency is noted but will not be addressed in this refactor. A future pass could standardize on a single pattern (e.g., `{ success, data, error }` wrapper for all actions).

---

## File Change Summary

| File | Action |
|------|--------|
| `src/app/api/saved-queries/route.ts` | **DELETE** |
| `src/app/api/saved-queries/[id]/route.ts` | **DELETE** |
| `src/app/api/user-role/route.ts` | **DELETE** (after Phase 2) |
| `src/app/api/listing/[id]/route.ts` | **DELETE** (after Phase 3) |
| `src/app/api/profile/route.ts` | **DELETE** (after Phase 4) |
| `src/app/api/profile/upload/route.ts` | **DELETE** (after Phase 5) |
| `src/actions/listing-actions.ts` | **MODIFY** — add `getListById()` |
| `src/actions/profile-actions.ts` | **CREATE** — add `updateProfile()` + `uploadProfileImage()` |
| `src/app/market/create-listing/page.tsx` | **MODIFY** — replace 2 fetch calls with actions |
| `src/components/profile/ProfileEditor.tsx` | **MODIFY** — replace 2 fetch calls with actions |
| `tests/profile/image-upload.spec.ts` | **MODIFY** — add 2 tests (replace image, remove image) |
| `tests/api/profile-upload-api.spec.ts` | **DELETE** |
