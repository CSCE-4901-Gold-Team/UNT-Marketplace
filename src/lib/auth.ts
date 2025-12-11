import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { ALLOWED_EMAIL_DOMAINS } from "@/constants/AuthConfig";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email-service";

// Prisma client
export const prisma = new PrismaClient();

export const ALLOWED_UNT_DOMAINS = ["my.unt.edu", "unt.edu"];

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
        debugLogs: false,
        usePlural: false,
        transaction: true,
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        // Domain validation
        validateEmail: async (email: string) => {
            const domain = email.split("@")[1];
            if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
                return {
                    valid: false,
                    error: `Only ${ALLOWED_EMAIL_DOMAINS.join(" or ")} email addresses are allowed`,
                };
            }
            return { valid: true };
        },
        // Password reset email
        sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
            await sendPasswordResetEmail(user.email, url);
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 300, // 5 minutes
        sendVerificationEmail: async ({ user, url }) => {
            await sendVerificationEmail(user.email, url);
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    plugins: [nextCookies()],
});
