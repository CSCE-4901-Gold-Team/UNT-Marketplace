export type ProfileUpdateResult = {
    success: boolean;
    user?: { id: string; name: string; email: string; image: string | null };
    error?: string;
};

export type ProfileImageUploadResult = {
    success: boolean;
    url?: string;
    error?: string;
};
