import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

export const prisma = new PrismaClient();

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
});

// Export allowed domains for validation in your sign-up action
export const ALLOWED_UNT_DOMAINS = ["my.unt.edu", "unt.edu"];
