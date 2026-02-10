"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {$Enums, PrismaClient} from "@/generated/prisma";
import UserRole = $Enums.UserRole;

const prisma = new PrismaClient();

export async function getCurrentUserRole() {
    // Validate session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const user = await prisma.user.findFirst({
        where: {
            id: session.user.id
        },
        select: {
            role: true
        }
    });

    return user?.role ?? UserRole.STUDENT;
}

/**
 * Look up a user by email for starting a conversation.
 * Returns minimal public profile so the current user can start a message with them.
 * Requires session. Returns null if not found or if the email is the current user's.
 */
export async function findUserByEmailForMessaging(email: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const user = await prisma.user.findFirst({
        where: {
            email: { equals: normalized, mode: "insensitive" }
        },
        select: {
            id: true,
            name: true,
            image: true,
            email: true
        }
    });

    if (!user || user.id === session.user.id) return null;
    return user;
}
