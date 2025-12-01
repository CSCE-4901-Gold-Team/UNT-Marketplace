"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {$Enums, PrismaClient} from "@prisma/client";
import UserRole = $Enums.UserRole;
import UserStatusType = $Enums.UserStatusType;

const prisma = new PrismaClient();

/**
 * Returns the role of the session's user
 * @return {Promise<$Enums.UserRole>}
 */
export async function getCurrentUserRole(): Promise<$Enums.UserRole> {
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
 * Retrieves and returns a User's current UserStatusType
 *
 * @param {string} userId The user ID to retrieve UserStatusType for
 * @return {Promise<{status: boolean, userStatus?: UserStatusType}>}
 *         Boolean status representing function success, and an optional UserStatusType
 */
export async function getUserStatus(userId: string): Promise<{status: boolean, userStatus: UserStatusType | null}> {
    // Validate session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    // Get role of current user and validate
    const currentUserRole = await getCurrentUserRole();
    if (!currentUserRole || currentUserRole !== UserRole.ADMIN ) {
        return {
            status: false,
            userStatus: null
        }
    }

    // Get current status
    const userStatus = await prisma.userStatus.findFirst({
        where: {
            userId: userId,
            OR: [
                { expiresAt: null },
                {
                    expiresAt: {
                        lte: new Date()
                    }
                }
            ]
        },
        orderBy: {
            expiresAt: { sort: "desc", nulls: "first" },
            createdAt: "desc"
        },
        select: {
            status: true
        }
    });

    // Return retrieved status, or active type if no status is found
    return {
        status: true,
        userStatus: userStatus?.status ?? UserStatusType.ACTIVE
    }
}
