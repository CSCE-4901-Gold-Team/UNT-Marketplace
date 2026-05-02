/**
 * StatusEnforcer.ts
 * Utility for checking and enforcing user suspension and ban statuses
 */

import { UserStatusType } from "@/prisma/generated";
import { prisma } from "@/lib/prisma";

export interface UserStatusCheck {
    isActive: boolean;
    status: UserStatusType;
    expiresAt: Date | null;
    reason?: string;
}

/**
 * Checks the current status of a user and enforces suspension/ban rules
 * 
 * @param {string} userId - The ID of the user to check
 * @returns {Promise<UserStatusCheck>} Object containing status info and enforcement details
 */
export async function checkUserStatus(userId: string): Promise<UserStatusCheck> {
    const userStatus = await prisma.userStatus.findFirst({
        where: {
            userId: userId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // No status found - user is active
    if (!userStatus) {
        return {
            isActive: true,
            status: UserStatusType.ACTIVE,
            expiresAt: null
        };
    }

    // Handle BANNED status - always enforced, no expiration
    if (userStatus.status === UserStatusType.BANNED) {
        return {
            isActive: false,
            status: UserStatusType.BANNED,
            expiresAt: null,
            reason: "Your account has been permanently banned"
        };
    }

    // Handle SUSPENDED status - check expiration
    if (userStatus.status === UserStatusType.SUSPENDED) {
        const now = new Date();

        // Check if suspension has expired
        if (userStatus.expiresAt && userStatus.expiresAt < now) {
            // Suspension expired - user is now active
            return {
                isActive: true,
                status: UserStatusType.ACTIVE,
                expiresAt: null,
                reason: "Your suspension has expired"
            };
        }

        // Suspension is still active
        return {
            isActive: false,
            status: UserStatusType.SUSPENDED,
            expiresAt: userStatus.expiresAt,
            reason: `Your account is suspended until ${userStatus.expiresAt?.toLocaleDateString() || "unknown date"}`
        };
    }

    // Status is ACTIVE
    return {
        isActive: true,
        status: UserStatusType.ACTIVE,
        expiresAt: null
    };
}

/**
 * Throws an error if user is suspended or banned
 * Use this in server actions to enforce status
 * 
 * @param {string} userId - The ID of the user to check
 * @throws {Error} If user is suspended or banned
 */
export async function enforceUserStatus(userId: string): Promise<void> {
    const statusCheck = await checkUserStatus(userId);

    if (!statusCheck.isActive) {
        throw new Error(statusCheck.reason || `Access denied: ${statusCheck.status}`);
    }
}

/**
 * Checks if a user is banned (not suspended, specifically banned)
 * 
 * @param {string} userId - The ID of the user to check
 * @returns {Promise<boolean>} True if user is banned
 */
export async function isUserBanned(userId: string): Promise<boolean> {
    const statusCheck = await checkUserStatus(userId);
    return statusCheck.status === UserStatusType.BANNED;
}

/**
 * Checks if a user is suspended (not including expired suspensions)
 * 
 * @param {string} userId - The ID of the user to check
 * @returns {Promise<boolean>} True if user is currently suspended
 */
export async function isUserSuspended(userId: string): Promise<boolean> {
    const statusCheck = await checkUserStatus(userId);
    return statusCheck.status === UserStatusType.SUSPENDED && !statusCheck.isActive;
}
