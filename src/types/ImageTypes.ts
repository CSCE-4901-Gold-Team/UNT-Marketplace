export interface SaveOptions {
    type: "listing" | "profile";
    maxSizeBytes?: number;
    maxDimension?: number;
    quality?: number;
}
