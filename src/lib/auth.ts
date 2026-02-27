import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { nextCookies } from "better-auth/next-js";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email-service";
import { prisma } from "@/lib/prisma";

export { prisma };

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
                console.log("🔗 URL from better-auth:", url);

                // Resolve the base URL dynamically.
                // Vercel sets VERCEL_URL automatically (without protocol) on every deployment.
                const baseUrl =
                    process.env.BETTER_AUTH_URL ||
                    process.env.APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    "http://localhost:3000";

                // better-auth may pass a relative or absolute URL – handle both.
                let token: string | null = null;
                try {
                    const urlObj = new URL(url);
                    token = urlObj.searchParams.get("token");
                } catch {
                    // Relative URL – use baseUrl so the constructor succeeds.
                    const urlObj = new URL(url, baseUrl);
                    token = urlObj.searchParams.get("token");
                }

                const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
                console.log("🔗 Verification URL:", verificationUrl);

                // Await the email send so Vercel doesn't terminate the
                // serverless function before SendGrid responds.
                const result = await sendVerificationEmail(user.email, verificationUrl);
                if (result.success) {
                    console.log("✅ Email verification sent successfully", result);
                } else {
                    console.error("❌ Email verification failed:", result.error);
                }
            } catch (error) {
                console.error("❌ Email verification callback initialization failed:", error);
            }
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    plugins: [nextCookies()],
});
