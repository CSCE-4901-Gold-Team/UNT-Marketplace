import fs from "fs";
import path from "path";

// -------- Types --------

export interface ImageSaveResult {
    url: string;
    filename: string;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export type ImageCategory = "profiles" | "listings";

// -------- Interface --------

export interface ImageStorageAdapter {
    save(buffer: Buffer, category: ImageCategory, extension: string): Promise<ImageSaveResult>;
    deleteByUrl(category: ImageCategory, url: string): Promise<boolean>;
    delete(category: ImageCategory, filename: string): Promise<boolean>;
    replace(category: ImageCategory, oldUrl: string, buffer: Buffer, extension: string): Promise<ImageSaveResult>;
    validate(file: File): Promise<ValidationResult>;
    generateFilename(originalName: string, extension?: string): string;
}

// -------- Local Filesystem Implementation --------

export class LocalImageStorage implements ImageStorageAdapter {
    protected baseDir: string;
    protected allowedTypes: string[];
    protected maxSize: number;

    constructor(options?: { baseDir?: string; allowedTypes?: string[]; maxSize?: number }) {
        this.baseDir = options?.baseDir ?? path.join(process.cwd(), "public", "uploads");
        this.allowedTypes = options?.allowedTypes ?? ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        this.maxSize = options?.maxSize ?? 5 * 1024 * 1024;
    }

    /**
     * Extract filename from a public URL path like /uploads/listings/123-abc.jpg
     */
    protected filenameFromUrl(category: ImageCategory, url: string): string {
        const expectedPrefix = `/uploads/${category}/`;
        if (!url.startsWith(expectedPrefix)) {
            const basename = path.basename(url);
            if (basename) return basename;
        }
        return path.basename(url);
    }

    /**
     * Delete a file by URL, checking both subdirectory and flat legacy paths
     */
    protected async deleteFileByPath(category: ImageCategory, filename: string): Promise<boolean> {
        // Try subdirectory path first (e.g., public/uploads/profiles/123.jpg)
        const subDirPath = path.join(this.baseDir, category, filename);
        try {
            await fs.promises.unlink(subDirPath);
            return true;
        } catch {
            // Fall through to try flat path
        }

        // Try flat legacy path (e.g., public/uploads/123.jpg)
        const flatPath = path.join(this.baseDir, filename);
        try {
            await fs.promises.unlink(flatPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Ensure the category subdirectory exists
     */
    protected async ensureDirectory(category: ImageCategory): Promise<void> {
        const dir = path.join(this.baseDir, category);
        await fs.promises.mkdir(dir, { recursive: true });
    }

    /**
     * Generate a unique filename from an original name
     */
    generateFilename(originalName: string, extension?: string): string {
        const ext = extension || path.extname(originalName) || ".jpg";
        return `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    }

    /**
     * Validate a File object for allowed type and max size
     */
    async validate(file: File): Promise<ValidationResult> {
        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.",
            };
        }

        if (file.size > this.maxSize) {
            return { valid: false, error: "File too large. Maximum size is 5MB." };
        }

        return { valid: true };
    }

    /**
     * Save a file buffer to the filesystem and return the public URL path
     */
    async save(
        buffer: Buffer,
        category: ImageCategory,
        extension: string
    ): Promise<ImageSaveResult> {
        await this.ensureDirectory(category);

        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
        const dest = path.join(this.baseDir, category, filename);

        await fs.promises.writeFile(dest, buffer);

        const url = `/uploads/${category}/${filename}`;
        return { url, filename };
    }

    /**
     * Delete a file by its public URL path
     */
    async deleteByUrl(category: ImageCategory, url: string): Promise<boolean> {
        try {
            const filename = this.filenameFromUrl(category, url);
            return this.deleteFileByPath(category, filename);
        } catch {
            return false;
        }
    }

    /**
     * Delete a file by filename within a category
     */
    async delete(category: ImageCategory, filename: string): Promise<boolean> {
        try {
            const filePath = path.join(this.baseDir, category, filename);
            await fs.promises.unlink(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Atomically replace an image: delete old, save new
     * If save fails, the old file remains intact
     */
    async replace(
        category: ImageCategory,
        oldUrl: string,
        buffer: Buffer,
        extension: string
    ): Promise<ImageSaveResult> {
        const result = await this.save(buffer, category, extension);

        if (oldUrl) {
            await this.deleteByUrl(category, oldUrl);
        }

        return result;
    }

    /**
     * Delete multiple images by their URL paths
     */
    async deleteMany(category: ImageCategory, urls: string[]): Promise<boolean[]> {
        return Promise.all(urls.map((url) => this.deleteByUrl(category, url)));
    }
}

// -------- Singleton Export --------

export const imageStorage = new LocalImageStorage();
