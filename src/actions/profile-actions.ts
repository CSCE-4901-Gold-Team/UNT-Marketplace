"use server";

import { prisma, auth } from "@/lib/auth";
import { headers } from "next/headers";
import fs from "fs";
import path from "path";
import { getSessionUserId } from "@/lib/session-utils";

/**
 * Server action to get user's current profile data
 */
export async function getProfile() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Not authenticated" };
        }

        const userId = getSessionUserId(session);

        if (!userId) {
            return { success: false, error: "User ID not found" };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, image: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        return { success: true, user };
    } catch (error) {
        console.error("Error fetching profile:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Server action to update the authenticated user's profile
 */
export async function updateProfileAction(data: { name: string; image?: string | null }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Not authenticated" };
        }

        const userId = getSessionUserId(session);

        if (!userId) {
            return { success: false, error: "User ID not found" };
        }

        const name = data.name.trim();
        if (!name) {
            return { success: false, error: "Name is required" };
        }

        if (name.length > 100) {
            return { success: false, error: "Name must be 100 characters or less" };
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                image: data.image ?? null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return { success: true, user: updated };
    } catch (error) {
        console.error("Error updating profile:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Server action to upload a profile image file
 */
export async function uploadProfileImageAction(
    file: File
): Promise<{ success: true; url: string } | { success: false; error: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Not authenticated" };
        }

        if (!file) {
            return { success: false, error: "No file provided" };
        }

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed" };
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return { success: false, error: "File too large. Maximum size is 5MB" };
        }

        const originalName = file.name || "upload";
        const ext = path.extname(originalName) || "";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.promises.mkdir(uploadDir, { recursive: true });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const dest = path.join(uploadDir, filename);
        await fs.promises.writeFile(dest, buffer);

        const url = `/uploads/${filename}`;
        return { success: true, url };
    } catch (error) {
        console.error("Error uploading profile image:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
