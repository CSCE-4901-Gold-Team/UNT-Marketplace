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
            // Fire and forget for password reset emails too
            sendPasswordResetEmail(user.email, url).catch(error => {
                console.error("❌ Password reset email failed (non-blocking):", error);
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 300, // 5 minutes
        sendVerificationEmail: async ({ user, url }) => {
            try {
                console.log("🔄 Starting email verification callback for:", user.email);
                // Extract the token from the better-auth URL
                // better-auth provides URL like: http://localhost:3000/api/auth/verify-email?token=...
                // We need to convert it to our verification page: /verify-email?token=...
                const urlObj = new URL(url);
                const token = urlObj.searchParams.get("token");
                const verificationUrl = `${process.env.BETTER_AUTH_URL}/verify-email?token=${token}`;
                
                console.log("🔗 Original URL from better-auth:", url);
                console.log("🔗 Converted verification URL:", verificationUrl);
                
                // Fire and forget - don't await to avoid blocking registration
                // Email sending happens in the background
                sendVerificationEmail(user.email, verificationUrl)
                    .then(result => {
                        console.log("✅ Email verification sent successfully", result);
                    })
                    .catch(error => {
                        console.error("❌ Email verification failed (non-blocking):", error);
                        // Email failure doesn't prevent registration
                    });
                // Return immediately without waiting for email to be sent
                return { success: true };
            } catch (error) {
                console.error("❌ Email verification callback initialization failed:", error);
                // Return success anyway - email will be sent in background
                return { success: true };
            }
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    plugins: [nextCookies()],
});
