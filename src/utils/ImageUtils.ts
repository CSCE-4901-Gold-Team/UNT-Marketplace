import crypto from "crypto";
import path from "path";
import { ImageConstants } from "@/constants/ImageConstants";

export const ImageUtils = {
    generateFilename(): string {
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString("hex");
        return `${timestamp}-${random}.jpg`;
    },

    getUploadDir(type: "listing" | "profile"): string {
        const subdir = type === "listing"
            ? ImageConstants.LISTINGS_SUBDIR
            : ImageConstants.PROFILES_SUBDIR;
        return path.join(process.cwd(), "public", ImageConstants.UPLOAD_BASE_PATH.replace(/^\//, ""), subdir);
    },

    isLocalFile(url: string): boolean {
        return url.startsWith(ImageConstants.UPLOAD_BASE_PATH);
    },

    getPathFromUrl(url: string): string {
        if (!this.isLocalFile(url)) return "";
        const relativePath = url.replace(/^\//, "");
        return path.join(process.cwd(), "public", relativePath);
    },

    base64ToBuffer(base64String: string): Buffer {
        const match = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!match) {
            throw new Error("Invalid base64 image string");
        }
        return Buffer.from(match[2], "base64");
    },

    getSubdir(type: "listing" | "profile"): string {
        return type === "listing"
            ? ImageConstants.LISTINGS_SUBDIR
            : ImageConstants.PROFILES_SUBDIR;
    },
};
