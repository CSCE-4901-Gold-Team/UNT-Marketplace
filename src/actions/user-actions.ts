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
 * @return {Promise<{status: number, userStatus?: UserStatusType}>}
 *         Number status representing HTTP response code, and an optional UserStatusType
 */
export async function getUserStatus(userId: string): Promise<{status: number, userStatus: UserStatusType | null}> {
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
            status: 403,
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
            createdAt: "desc"
        },
        select: {
            status: true
        }
    });

    // Return retrieved status, or active type if no status is found
    return {
        status: 200,
        userStatus: userStatus?.status ?? UserStatusType.ACTIVE
    }
}


/**
 * Internal helper function to apply UserStatuses
 *
 * @param {string} userId The ID of the user to suspend
 * @param {UserStatusType} userStatus The UserStatusType to apply to the user
 * @param {Date} expires Required expiration date of suspension
 * @return {Promise<{ status: number }>} Status representing HTTP response code
 */
async function createUserStatus(userId: string, userStatus: UserStatusType, expires: Date | null): Promise<{ status: number }> {
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
            status: 403
        }
    }

    // Insert UserStatus Record
    const createdUserStatus = await prisma.userStatus.create({
        data: {
            userId: userId,
            status: userStatus,
            expiresAt: expires
        }
    });

    return {
        status: !!createdUserStatus ? 200 : 500,
    }
}

/**
 * Suspends a user, suspension expiration date is required. If permanent suspension is
 * needed then a ban should be applied.
 *
 * @param {string} userId The ID of the user to suspend
 * @param {Date} expires Required expiration date of suspension
 * @return {Promise<{ status: number }>} Status representing HTTP response code
 */
export async function suspendUser(userId: string, expires: Date): Promise<{ status: number }> {
    return await createUserStatus(userId, UserStatusType.SUSPENDED, expires);
}

/**
 * Bans a user. Bans are permanent without manual reversal.
 *
 * @param {string} userId The ID of the user to ban
 * @return {Promise<{ status: number }>} Status representing HTTP response code
 */
export async function banUser(userId: string): Promise<{ status: number }> {
    return await createUserStatus(userId, UserStatusType.BANNED, null);
}

/**
 * Sets a user's status to Active, this overrides any current bans or suspensions
 *
 * @param {string} userId The ID of the user to set the active status for
 * @return {Promise<{ status: number }>} Status representing HTTP response code
 */
export async function setUserActive(userId: string): Promise<{ status: number }> {
    return await createUserStatus(userId, UserStatusType.ACTIVE, null);
}
