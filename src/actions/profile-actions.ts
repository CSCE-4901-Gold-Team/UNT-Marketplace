"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { imageAdapter } from "@/lib/image-adapter";
import { ImageUtils } from "@/utils/ImageUtils";
import { ProfileUpdateResult, ProfileImageUploadResult } from "@/types/ProfileTypes";

/**
 * Updates the authenticated user's profile (name and image).
 * Cleans up old local profile image file if it was replaced.
 */
export async function updateProfile(
    name: string,
    image: string | null
): Promise<ProfileUpdateResult> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        redirect("/login");
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
        return { success: false, error: "Name is required" };
    }

    const newImage = image?.trim() || null;

    const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true },
    });

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: trimmedName,
            image: newImage,
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    });

    if (
        existing?.image &&
        ImageUtils.isLocalFile(existing.image) &&
        existing.image !== newImage
    ) {
        await imageAdapter.deleteFile(existing.image);
    }

    return { success: true, user: updated };
}

/**
 * Uploads a profile image from a base64 data URL.
 * Uses the image adapter with profile type for compression and storage.
 */
export async function uploadProfileImage(
    base64String: string
): Promise<ProfileImageUploadResult> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        redirect("/login");
    }

    try {
        const url = await imageAdapter.saveFromBase64(base64String, {
            type: "profile",
        });
        return { success: true, url };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
    }
}
