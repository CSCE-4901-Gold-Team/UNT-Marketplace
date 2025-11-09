import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

export const prisma = new PrismaClient();

// Allowed UNT email domains
const ALLOWED_UNT_DOMAINS = ["my.unt.edu", "unt.edu"];

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 300, // 5 minutes
    },
    passwordReset: {
        enabled: true,
        expiresIn: 300, // 5 minutes
    },
    plugins: [
        emailOTP({
            overrideDefaultEmailVerification: true,
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({ email, otp, type }: { email: string; otp: string; type: "sign-in" | "email-verification" | "forget-password" }) {
                console.log(`[EMAIL OTP] Type: ${type}, Email: ${email}, OTP: ${otp}`);
            },
        }),
        nextCookies(),
    ],
    // Use the onRequest hook for email validation
    async onRequest(request, context) {
        // Check if this is a sign-up request
        if (request.url.includes('/sign-up') && request.method === 'POST') {
            const body = await request.json();
            const email = body.email;

            if (email) {
                const emailDomain = email.split("@")[1]?.toLowerCase();
                if (!emailDomain || !ALLOWED_UNT_DOMAINS.includes(emailDomain)) {
                    throw new Error(`Only UNT email addresses (@${ALLOWED_UNT_DOMAINS.join(", @")}) are allowed for registration.`);
                }
            }
        }
    },
});
