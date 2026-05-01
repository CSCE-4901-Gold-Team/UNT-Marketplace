# Unified Image Adapter Plan

## Overview

Create a centralized `ImageAdapter` in `src/lib/image-adapter.ts` that unifies all image handling across the application. Currently, listing images are stored as base64 data URLs directly in the PostgreSQL `Image.url` column, while profile images are saved as static files in `public/uploads/`. The adapter will standardize on **static file storage** with the file path stored in the database, include **server-side compression via `sharp`**, and support **deferred persistence** (files are not written to disk until the entity is saved).

---

## Current State Analysis

| Entity | Current Storage | Validation | Compression | Issues |
|--------|----------------|------------|-------------|--------|
| Listing images (`Image.url`) | base64 in DB (`src/actions/listing-create.ts:167-175`) | Client-side only (`ImageUpload.tsx:40-53`) | Client canvas, JPEG 70%, 1200px (`ImageUpload.tsx:64-95`) | Bloated DB, inconsistent with profiles, no cleanup |
| Profile images (`User.image`) | File on disk (`/api/profile/upload/route.ts:26-35`) | None | None | No validation, no compression, orphaned files never cleaned |
| Seed images | Static files in `/public/` | N/A | N/A | Paths stored directly in DB |

**Key files involved:**
- `src/actions/listing-create.ts` — creates listing + base64 images
- `src/actions/listing-update.ts` — updates listing, replaces all images (`:182-196`)
- `src/actions/listing-delete.ts` — deletes listing + image records (`:57-59`), no file cleanup
- `src/app/api/profile/upload/route.ts` — saves profile images to disk
- `src/app/api/profile/route.ts` — updates user profile (image URL)
- `src/components/ui/ImageUpload.tsx` — client-side listing image upload (base64)
- `src/components/profile/ProfileEditor.tsx` — profile image upload
- `src/app/market/create-listing/page.tsx` — create/edit listing page
- `prisma/schema.prisma:102-114` — `Image` model, `url: String`
- `prisma/schema.prisma:28` — `User.image: String?`

---

## Design

### 1. Adapter API (`src/lib/image-adapter.ts`)

The adapter exposes a clean, easy-to-understand interface. Two categories of functions:

**File operations** (adapter handles disk I/O + compression):

```typescript
interface SaveOptions {
  type: 'listing' | 'profile';
  maxSizeBytes?: number;   // default: 5MB
  maxDimension?: number;   // default: 1200
  quality?: number;        // default: 0.8 (JPEG quality)
}

// Convert base64 data URL → compressed file on disk → return relative path
saveFromBase64(base64String: string, options?: SaveOptions): Promise<string>;

// Save a raw buffer → compressed file on disk → return relative path
saveFromBuffer(buffer: Buffer, originalName: string, options?: SaveOptions): Promise<string>;

// Delete a single file from disk (no-op if path is external URL or base64)
deleteFile(url: string): Promise<void>;

// Delete all files for a listing from disk
deleteListingFiles(urls: string[]): Promise<void>;

// Validate a base64 string or buffer against constraints
validate(base64OrBuffer: string | Buffer, options?: SaveOptions): Promise<boolean>;
```

**Database operations** (adapter handles Image table CRUD):

```typescript
// Create Image records for new file paths
createImageRecords(listingId: string, urls: string[]): Promise<void>;

// Delete Image records by URLs (selective — only matching rows removed)
deleteImageRecords(listingId: string, urlsToDelete: string[]): Promise<void>;

// Delete ALL Image records + files for a listing (cascade cleanup)
deleteAllForListing(listingId: string): Promise<void>;

// Set profile image on User, optionally deleting old file
setProfileImage(userId: string, newUrl: string): Promise<void>;
```

### 2. Storage Structure

```
public/
  uploads/
    listings/
      <timestamp>-<random>.jpg    # compressed listing images
    profiles/
      <timestamp>-<random>.jpg    # compressed profile images
```

File naming: `{type}/{timestamp}-{random}.{ext}` — e.g., `listings/1714000000000-a1b2c3.jpg`

### 3. Deferred Persistence Flow

All image data travels through the form as base64 strings (existing behavior). Files are **not written to disk** until the server action runs on form submission.

**Creating a new listing:**
1. User selects files → `ImageUpload` converts to base64 for preview (existing canvas compression)
2. User adds/removes images freely — all changes tracked in client `previews[]` state
3. User clicks "Save" → form submits `imagePath` (JSON array of base64 strings) via hidden input
4. Server action calls `imageAdapter.saveFromBase64()` for each → compressed files written to `public/uploads/listings/`
5. Server action calls `imageAdapter.createImageRecords()` → `Image` records created with file paths
6. If any step fails, listing creation rolls back; orphaned files cleaned up

**Editing an existing listing (selective update):**

The `ImageUpload` component maintains a single `previews[]` array that after user edits contains a mix of:
- Existing file paths (images the user kept) — e.g., `/uploads/listings/abc.jpg`
- New base64 strings (images the user added) — e.g., `data:image/jpeg;base64,...`

Plus a separate `removedUrls[]` array tracking existing images the user removed.

On save, the form submits two fields:
- `imagePath`: JSON array of ALL current images (kept paths + new base64s)
- `removedImageUrls`: JSON array of existing paths the user removed

The server action distinguishes the two types and processes only what changed:

```
Submitted imagePath:  ["/uploads/listings/def.jpg", "/uploads/listings/ghi.jpg", "data:image/..."]
Submitted removedUrls: ["/uploads/listings/abc.jpg"]

→ DELETE:  abc.jpg from disk + delete DB record          (removed by user)
→ KEEP:    def.jpg, ghi.jpg — no action at all            (unmodified)
→ CREATE:  compress base64 → write to disk → insert DB   (new upload)
```

**Profile image:**
1. User selects file → `ProfileEditor` POSTs raw file to `/api/profile/upload`
2. Adapter compresses via sharp, writes to `public/uploads/profiles/`, returns path
3. User clicks "Save" → `/api/profile` PATCH updates `User.image` with the path
4. If user replaces profile image, old file (if local `/uploads/` path) is deleted

### 4. Server-Side Compression (sharp)

The adapter will use `sharp` for server-side compression:
- Resize to max 1200x1200 (maintain aspect ratio)
- Convert to JPEG at 80% quality
- Validate MIME type (jpeg, png, gif, webp)
- Max file size: 5MB before compression

---

## Implementation Plan

### Phase 1: Foundation

**Step 1.1 — Add `sharp` dependency**
```bash
npm install sharp
npm install -D @types/sharp  # if needed
```

**Step 1.2 — Create `src/lib/image-adapter.ts`**

Internal helpers:
- `generateFilename(type: string): string` — `{timestamp}-{random}.jpg`
- `getUploadDir(type: string): string` — `public/uploads/{type}/`
- `compressImage(buffer: Buffer, options): Promise<Buffer>` — sharp pipeline: detect format → resize max 1200px → JPEG 80%
- `isLocalFile(url: string): boolean` — returns true if url starts with `/uploads/`
- `getPathFromUrl(url: string): string` — extracts filesystem path from a `/uploads/...` URL

Public API (see Design §1 above for full signatures). Key implementation notes:
- `saveFromBase64` strips the `data:` prefix → decodes → validates → compresses → writes to disk → returns `/uploads/{type}/{filename}`
- `saveFromBuffer` validates MIME → compresses → writes to disk → returns path
- `deleteFile` checks `isLocalFile`, calls `fs.unlink`, no-op for external URLs or base64
- `createImageRecords` calls `prisma.image.createMany`
- `deleteImageRecords` calls `prisma.image.deleteMany` with `{ where: { listingId, url: { in: urls } } }` — **selective delete, only matching rows**
- `deleteAllForListing` fetches all URLs → deletes files from disk → deletes all DB records
- `setProfileImage` fetches old `User.image`, deletes old file if local → updates `User.image`

### Phase 2: Update Listing Actions

**Step 2.1 — Update `src/actions/listing-create.ts`**

At `:129-143`, replace base64 DB storage with adapter. The listing ID doesn't exist yet, so we save files first, then create records inside the transaction:

```typescript
// Parse base64 array from form (existing logic at :134-143)
const imagesParsed = /* JSON.parse(imagePath) → string[] */;

// Separate base64 strings (all images are new on create)
const newBase64s = imagesParsed.filter(s => s.startsWith('data:'));

// Save new files to disk BEFORE transaction (sharp compression)
const newPaths = await Promise.all(
  newBase64s.map(b64 => imageAdapter.saveFromBase64(b64, { type: 'listing' }))
);

const newListing = await prisma.$transaction(async (tx) => {
  const listing = await tx.listing.create({
    data: {
      title: titleC.censored,
      description: descC.censored,
      price: parseFloat(parsedFormData.data.price),
      isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
      listingStatus,
      ownerId: session.user.id,
      categories: { connect: parsedFormData.data.categoryIds.map(id => ({ id })) },
    },
  });

  // Create Image records with file paths
  if (newPaths.length > 0) {
    await tx.image.createMany({
      data: newPaths.map((url, i) => ({
        url,
        listingId: listing.id,
        imageType: 'LISTING',
        sortOrder: i,
      })),
    });
  }

  // Profanity flag creation... (existing logic unchanged)

  return listing;
});

// If transaction fails, clean up orphaned files
// (wrapped in try/catch around the transaction)
```

**Step 2.2 — Update `src/actions/listing-update.ts`**

At `:96-114` and `:182-196`, replace the "delete all + recreate" logic with **selective operations** that only touch changed images. This is the critical change — unmodified images are never touched.

Add `removedImageUrls` to the Zod schema at `:24`:
```typescript
removedImageUrls: z.string().optional(),
```

Parse it from formData at `:51`:
```typescript
removedImageUrls: formData.get("removedImageUrls") as string || "[]",
```

Replace the image handling block (`:96-196`) with:

```typescript
// --- Parse submitted images ---
const submittedRaw = parsedFormData.data.imagePath || "[]";
const allSubmitted: string[] = JSON.parse(submittedRaw);

const removedRaw = parsedFormData.data.removedImageUrls || "[]";
const removedUrls: string[] = JSON.parse(removedRaw);

// Separate new uploads (base64) from kept existing images (file paths)
const newBase64s = allSubmitted.filter(s => typeof s === 'string' && s.startsWith('data:'));
const keptPaths = allSubmitted.filter(s => typeof s === 'string' && !s.startsWith('data:'));

// --- Save new files to disk (sharp compression) ---
const newPaths = await Promise.all(
  newBase64s.map(b64 => imageAdapter.saveFromBase64(b64, { type: 'listing' }))
);

// --- Apply within transaction ---
// Use direct prisma.image calls for selective updates (cleaner than nested writes)
const updateData: Prisma.ListingUpdateInput = {
  title: titleC.censored,
  description: descC.censored,
  price: new Prisma.Decimal(parsedFormData.data.price),
  isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
  categories: { set: parsedFormData.data.categoryIds.map(id => ({ id})) },
  // ... listingStatus logic (unchanged) ...
};

try {
  await prisma.$transaction(async (tx) => {
    // Update listing fields
    await tx.listing.update({ where: { id: listingId }, data: updateData });

    // Delete ONLY removed image records (not all images)
    if (removedUrls.length > 0) {
      await tx.image.deleteMany({
        where: { listingId, url: { in: removedUrls } },
      });
    }

    // Create records ONLY for new images
    if (newPaths.length > 0) {
      // Calculate sortOrder after removals
      const remaining = await tx.image.findMany({
        where: { listingId, url: { notIn: removedUrls } },
        orderBy: { sortOrder: 'asc' },
      });
      await tx.image.createMany({
        data: newPaths.map((url, i) => ({
          url,
          listingId,
          imageType: 'LISTING',
          sortOrder: remaining.length + i,
        })),
      });
    }

    // ... profanity flag logic (unchanged) ...
  });

  // Transaction succeeded — clean up removed files from disk
  if (removedUrls.length > 0) {
    await imageAdapter.deleteListingFiles(removedUrls);
  }
} catch (error) {
  // Transaction failed — clean up newly written files to avoid orphans
  if (newPaths.length > 0) {
    await imageAdapter.deleteListingFiles(newPaths);
  }
  throw error;
}
```

**What happens to each image in a typical edit scenario:**

| Image | Type in `allSubmitted` | In `removedUrls` | Action |
|-------|----------------------|------------------|--------|
| abc.jpg (user removed) | not present | yes | DB record deleted + file deleted from disk |
| def.jpg (user kept) | present as path | no | **No action** — stays on disk and in DB |
| ghi.jpg (user kept) | present as path | no | **No action** — stays on disk and in DB |
| new.jpg (user added) | present as base64 | no | Compressed → saved to disk → DB record created |

**Step 2.3 — Update `src/actions/listing-delete.ts`**

At `:52-64`, replace the image deletion block with adapter call:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.listingEvent.deleteMany({ where: { listingId } });

  // Fetch image URLs for disk cleanup
  const images = await tx.image.findMany({
    where: { listingId },
    select: { url: true },
  });

  await tx.image.deleteMany({ where: { listingId } });
  await tx.listing.delete({ where: { id: listingId } });
});

// Delete files from disk after transaction succeeds
if (images.length > 0) {
  await imageAdapter.deleteListingFiles(images.map(i => i.url));
}
```

### Phase 3: Update Profile Upload

**Step 3.1 — Replace `src/app/api/profile/upload/route.ts`**

Replace the manual file handling (`:21-36`) with an adapter call:
```typescript
const f = file as unknown as { name?: string; arrayBuffer: () => Promise<ArrayBuffer> };
const buffer = Buffer.from(await f.arrayBuffer());

const url = await imageAdapter.saveFromBuffer(buffer, f.name || "upload.jpg", {
  type: 'profile',
});

return NextResponse.json({ success: true, url });
```

The adapter handles: MIME validation, sharp compression, unique filename generation, writing to `public/uploads/profiles/`.

**Step 3.2 — Update `src/app/api/profile/route.ts`**

At `:23-28`, before updating the user, delete the old profile file if it was a local upload:
```typescript
const existingUser = await prisma.user.findUnique({
  where: { id: userId },
  select: { image: true },
});

const updated = await imageAdapter.setProfileImage(userId, image?.trim() || null);

// setProfileImage internally:
// 1. Fetches old User.image
// 2. If old value starts with '/uploads/', calls fs.unlink to delete the file
// 3. Updates User.image with the new value
```

**Step 3.3 — `src/components/profile/ProfileEditor.tsx`**

No structural changes needed. The existing two-step flow (upload file → get URL → save profile) already works correctly. The upload endpoint now uses the adapter for compression and validation.

### Phase 4: Update Frontend Components

**Step 4.1 — Update `src/components/ui/ImageUpload.tsx`**

Major changes:
- Keep client-side base64 conversion for preview (existing behavior)
- Add tracking of `removedImageUrls` — when user clicks remove on an existing image (one that's a file path, not a base64 string), add it to a `removedUrls` set
- Add a new hidden input for `removedImageUrls` alongside the existing `imagePath` hidden input
- Distinguish between "new" images (base64) and "existing" images (file paths) in the submitted data

Key logic at `:111-115` (removeImage):
```typescript
const removeImage = (index: number) => {
  const removed = previews[index];
  const newPreviews = previews.filter((_, i) => i !== index);
  
  // Track removed existing images (file paths, not base64)
  if (!removed.startsWith('data:')) {
    setRemovedUrls(prev => [...prev, removed]);
  }
  
  setPreviews(newPreviews);
  onImagesChange(newPreviews);
};
```

New props:
```typescript
interface ImageUploadProps {
  // ... existing props
  onRemovedChange?: (urls: string[]) => void; // callback for removed URLs
}
```

Additional hidden input at `:193`:
```tsx
<input type="hidden" name="removedImageUrls" value={JSON.stringify(removedUrls)} />
```

**Step 4.2 — Update `src/app/market/create-listing/page.tsx`**

At `:53`, add state for removed URLs:
```typescript
const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
```

Pass to `ImageUpload` at `:252-258`:
```tsx
<ImageUpload
  // ... existing props
  onRemovedChange={setRemovedImageUrls}
/>
```

### Phase 5: Migrate Existing Data

**Step 5.1 — Create migration script**

One-time script to migrate existing base64 images in the database to static files:
```typescript
// scripts/migrate-images-to-disk.ts
const images = await prisma.image.findMany({ where: { url: { startsWith: 'data:' } } });
for (const img of images) {
  const buffer = base64ToBuffer(img.url);
  const result = await imageAdapter.saveImageFromBuffer(buffer, `migrated-${img.id}.jpg`, 'listing');
  await prisma.image.update({
    where: { id: img.id },
    data: { url: result.url },
  });
}
```

Run once after deployment: `npx tsx scripts/migrate-images-to-disk.ts`

### Phase 6: Update Display Components

**No changes needed** for display components (`ListingCard.tsx`, `ImageCarousel.tsx`, `ChatWindow.tsx`) — they consume the `url` field which will now contain file paths instead of base64 strings. The `<Image unoptimized>` prop already handles both cases correctly.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/image-adapter.ts` | Main adapter with all image handling logic |
| `scripts/migrate-images-to-disk.ts` | One-time migration script for existing base64 images |

## Files to Modify

| File | Changes |
|------|---------|
| `src/actions/listing-create.ts` | Replace base64 DB storage with adapter calls |
| `src/actions/listing-update.ts` | Replace image logic with adapter + track removed images |
| `src/actions/listing-delete.ts` | Add `imageAdapter.deleteImage()` for disk cleanup |
| `src/app/api/profile/upload/route.ts` | Replace with adapter call |
| `src/app/api/profile/route.ts` | Add old image cleanup on update |
| `src/components/ui/ImageUpload.tsx` | Add removed URL tracking, pass through hidden input |
| `src/components/profile/ProfileEditor.tsx` | Minor updates for adapter compatibility |
| `src/app/market/create-listing/page.tsx` | Add removed URL state, pass to ImageUpload |
| `package.json` | Add `sharp` dependency |

## Files Unchanged

| File | Reason |
|------|--------|
| `prisma/schema.prisma` | `Image.url` remains `String`, `User.image` remains `String?` — no schema changes needed |
| `src/components/ui/ListingCard.tsx` | Consumes `url` field, works with both base64 and paths |
| `src/components/ui/ImageCarousel.tsx` | Same as above |
| `src/components/ui/ChatWindow.tsx` | Same as above |
| `src/actions/chat-actions.ts` | Reads `.url` field, no changes needed |
| `src/actions/admin-actions.ts` | Reads `.url` field, no changes needed |
| `next.config.ts` | `unoptimized: true` still needed for local paths |

---

## Testing Plan

1. **Unit tests** for `image-adapter.ts`:
   - `saveImageFromBase64` — verifies file written to correct path, DB record created
   - `deleteImage` — verifies file removed from disk, DB record deleted
   - `compressImage` — verifies output dimensions, quality, format
   - `validateFile` — verifies MIME type and size checks

2. **Integration tests**:
   - Create listing with images → verify files on disk, DB records with paths
   - Update listing (add/remove images) → verify correct files added/removed
   - Delete listing → verify all files cleaned up
   - Upload profile image → verify file on disk, DB updated
   - Replace profile image → verify old file deleted, new file saved

3. **E2E tests** (Playwright):
   - Test image upload flow on create listing page
   - Test image removal flow on edit listing page
   - Test profile image upload flow

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Sharp not available on Windows/dev | Sharp includes prebuilt binaries; test on target platforms |
| Large existing base64 images in DB | Migration script handles one-at-a-time processing with error recovery |
| Disk space exhaustion | File size limits enforced. Consider periodic orphan cleanup cron. |
| Concurrent uploads overwriting files | Unique filename with timestamp + random string prevents collisions |
| Base64 → disk migration fails mid-way | Transaction-based migration with rollback on error |
| Orphaned files if DB transaction fails | Files written before DB transaction. If transaction fails, files remain orphaned. Mitigation: adapter cleans up new files on transaction failure; periodic cron sweeps for unreferenced files |

---

## Rollback Plan

If issues arise, the adapter can be configured to fall back to base64 storage via a feature flag. The migration script can be reversed by converting file paths back to base64. The `Image.url` field type (`String`) supports both formats, so no schema rollback is needed.

---

## Open Questions / Decisions Made

**Q: Why write files before the DB transaction instead of after?**

If we write files after the transaction and a file write fails, we have DB records pointing to nonexistent files. If we write files before and the transaction fails, we have orphaned files on disk. Orphaned files are the lesser evil — they waste disk space but don't break the application. A periodic cleanup cron (or manual `npm run cleanup-orphaned-images`) can remove unreferenced files. The adapter also attempts immediate cleanup of newly written files if the subsequent transaction throws.

**Q: Why use direct `prisma.image` calls instead of Prisma nested writes for image updates?**

Direct calls (`tx.image.deleteMany`, `tx.image.createMany`) inside the transaction are clearer than nested writes for this use case. The old code used `deleteMany: {}` which wiped all images. Direct calls let us selectively delete only removed rows (`url: { in: removedUrls }`) and create only new rows, with explicit control over `sortOrder` calculation.
