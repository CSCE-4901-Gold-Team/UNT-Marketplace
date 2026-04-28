import fs from "fs";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import type { SaveOptions } from "@/types/ImageTypes";
import { ImageConstants } from "@/constants/ImageConstants";
import { ImageUtils } from "@/utils/ImageUtils";

// --- Internal helpers ---

function resolveOptions(partial?: Partial<SaveOptions>): Required<SaveOptions> {
    return { ...ImageConstants.DEFAULT_OPTIONS, ...partial };
}

async function compressImage(buffer: Buffer, options: Required<SaveOptions>): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    let outputWidth = width;
    let outputHeight = height;

    if (width > options.maxDimension || height > options.maxDimension) {
        if (width > height) {
            outputHeight = Math.round((height * options.maxDimension) / width);
            outputWidth = options.maxDimension;
        } else {
            outputWidth = Math.round((width * options.maxDimension) / height);
            outputHeight = options.maxDimension;
        }
    }

    return sharp(buffer)
        .resize(outputWidth, outputHeight, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .jpeg({ quality: options.quality })
        .toBuffer();
}

async function validateBuffer(buffer: Buffer, options: Required<SaveOptions>): Promise<void> {
    if (buffer.length > options.maxSizeBytes) {
        throw new Error(`File exceeds maximum size of ${options.maxSizeBytes / (1024 * 1024)}MB`);
    }

    const metadata = await sharp(buffer).metadata();
    const format = metadata.format as string;

    if (!format || !ImageConstants.ALLOWED_FORMATS.includes(format as (typeof ImageConstants.ALLOWED_FORMATS)[number])) {
        throw new Error(`Unsupported image type: ${format}. Allowed: ${ImageConstants.ALLOWED_FORMATS.join(", ")}`);
    }
}

// --- Public API: File operations ---

async function saveFromBase64(base64String: string, options?: Partial<SaveOptions>): Promise<string> {
    const opts = resolveOptions(options);
    const buffer = ImageUtils.base64ToBuffer(base64String);
    await validateBuffer(buffer, opts);
    const compressed = await compressImage(buffer, opts);

    const uploadDir = ImageUtils.getUploadDir(opts.type);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const filename = ImageUtils.generateFilename();
    const dest = path.join(uploadDir, filename);
    await fs.promises.writeFile(dest, compressed);

    const subdir = ImageUtils.getSubdir(opts.type);
    return `${ImageConstants.UPLOAD_BASE_PATH}/${subdir}/${filename}`;
}

async function saveFromBuffer(buffer: Buffer, _originalName: string, options?: Partial<SaveOptions>): Promise<string> {
    const opts = resolveOptions(options);
    await validateBuffer(buffer, opts);
    const compressed = await compressImage(buffer, opts);

    const uploadDir = ImageUtils.getUploadDir(opts.type);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const filename = ImageUtils.generateFilename();
    const dest = path.join(uploadDir, filename);
    await fs.promises.writeFile(dest, compressed);

    const subdir = ImageUtils.getSubdir(opts.type);
    return `${ImageConstants.UPLOAD_BASE_PATH}/${subdir}/${filename}`;
}

async function deleteFile(url: string): Promise<void> {
    if (!ImageUtils.isLocalFile(url)) return;
    const filePath = ImageUtils.getPathFromUrl(url);
    try {
        await fs.promises.unlink(filePath);
    } catch {
        // File may not exist; ignore
    }
}

async function deleteListingFiles(urls: string[]): Promise<void> {
    const localUrls = urls.filter(ImageUtils.isLocalFile);
    await Promise.all(localUrls.map(deleteFile));
}

async function validate(input: string | Buffer, options?: Partial<SaveOptions>): Promise<boolean> {
    const opts = resolveOptions(options);
    try {
        const buffer = typeof input === "string"
            ? ImageUtils.base64ToBuffer(input)
            : input;
        await validateBuffer(buffer, opts);
        return true;
    } catch {
        return false;
    }
}

// --- Public API: Database operations ---

async function createImageRecords(listingId: string, urls: string[]): Promise<void> {
    if (urls.length === 0) return;
    await prisma.image.createMany({
        data: urls.map((url, i) => ({
            url,
            listingId,
            imageType: "LISTING",
            sortOrder: i,
        })),
    });
}

async function deleteImageRecords(listingId: string, urlsToDelete: string[]): Promise<void> {
    if (urlsToDelete.length === 0) return;
    await prisma.image.deleteMany({
        where: {
            listingId,
            url: { in: urlsToDelete },
        },
    });
}

async function deleteAllForListing(listingId: string): Promise<void> {
    const images = await prisma.image.findMany({
        where: { listingId },
        select: { url: true },
    });

    await deleteListingFiles(images.map((img) => img.url));

    await prisma.image.deleteMany({
        where: { listingId },
    });
}

async function setProfileImage(
    userId: string,
    newUrl: string | null,
): Promise<{ id: string; name: string; email: string; image: string | null }> {
    const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
    });

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { image: newUrl },
        select: { id: true, name: true, email: true, image: true },
    });

    if (existing?.image && ImageUtils.isLocalFile(existing.image) && existing.image !== newUrl) {
        await deleteFile(existing.image);
    }

    return updated;
}

// --- Exported adapter ---

export const imageAdapter = {
    // File operations
    saveFromBase64,
    saveFromBuffer,
    deleteFile,
    deleteListingFiles,
    validate,

    // Database operations
    createImageRecords,
    deleteImageRecords,
    deleteAllForListing,
    setProfileImage,

    // Utilities
    isLocalFile: ImageUtils.isLocalFile,
} as const;
