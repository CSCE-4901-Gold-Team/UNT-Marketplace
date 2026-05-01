# Image Adapter

Centralized image handling in `src/lib/image-adapter.ts`. All image upload, compression, storage, and deletion goes through this adapter.

## Structure

| File | Purpose |
|------|---------|
| `src/lib/image-adapter.ts` | Core adapter — save, delete, DB CRUD |
| `src/types/ImageTypes.ts` | `SaveOptions`, `ImageUploadResult` |
| `src/constants/ImageConstants.ts` | Allowed formats, defaults, path constants |
| `src/utils/ImageUtils.ts` | Filename gen, path resolution, base64 decode |

## Storage

Images are compressed with `sharp` and saved as static files:
- Listing images: `public/uploads/listings/{timestamp}-{random}.jpg`
- Profile images: `public/uploads/profiles/{timestamp}-{random}.jpg`

The `Image.url` and `User.image` DB fields store the relative path (e.g., `/uploads/listings/1714000000000-a1b2c3.jpg`), NOT base64.

## Key Functions

```ts
// Convert base64 → compress → save to disk → return relative path
imageAdapter.saveFromBase64(base64String, { type: 'listing' })

// Save buffer → compress → save to disk → return relative path
imageAdapter.saveFromBuffer(buffer, name, { type: 'profile' })

// Delete file from disk (no-op for external URLs or base64)
imageAdapter.deleteFile(url)

// Bulk delete files from disk
imageAdapter.deleteListingFiles(urls)

// Check if a URL is a local file path
imageAdapter.isLocalFile(url)
```

## Listing Image Update Flow (Critical)

When editing a listing, only **changed** images are processed. Unmodified images are never touched.

The `ImageUpload` component submits two hidden fields:
- `imagePath` — JSON array of ALL current images (kept paths + new base64 strings)
- `removedImageUrls` — JSON array of existing file paths the user removed

The server action in `listing-update.ts` separates them:
1. New base64 strings → `saveFromBase64()` → write to disk → create DB records
2. Removed paths → `deleteMany` in DB → delete from disk
3. Kept paths → **no action**

Files are written to disk **before** the DB transaction. If the transaction fails, newly written files are cleaned up in a catch block.

## Migration

Existing base64 images in the DB can be migrated with:
```bash
npx tsx scripts/migrate-images-to-disk.ts
```

## Sharp Dependency

`sharp` must be installed for the platform the server runs on. If the server is on Windows (`win32-x64`) but sharp was installed on Linux, the `/market/create-listing` page will show a runtime error. Run `npm install sharp` on the server machine.
