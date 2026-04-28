import { SaveOptions } from "@/types/ImageTypes";

export const ImageConstants = {
    ALLOWED_FORMATS: ["jpeg", "jpg", "png", "gif", "webp"] as const,

    DEFAULT_OPTIONS: {
        type: "listing",
        maxSizeBytes: 5 * 1024 * 1024,
        maxDimension: 1200,
        quality: 80,
    } as Required<SaveOptions>,

    UPLOAD_BASE_PATH: "/uploads",
    LISTINGS_SUBDIR: "listings",
    PROFILES_SUBDIR: "profiles",
} as const;
