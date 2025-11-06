import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "@/../generated/prisma";
import {nextCookies} from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

const prisma = new PrismaClient();

// Allowed UNT email domains
const ALLOWED_UNT_DOMAINS = ["my.unt.edu", "unt.edu"];

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true, // require email verification
    },
    // Add password reset functionality
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 300, // 5 minutes
    },
    passwordReset: {
        enabled: true,
        expiresIn: 300, // 5 minutes
    },
    hooks: {
        signUp: {
            before: async ({ body }: { body: { email: string; password: string; name?: string } }) => {
                // Validate email domain for UNT emails only
                const email = body.email;
                if (!email) {
                    throw new Error("Email is required");
                }

                const emailDomain = email.split("@")[1]?.toLowerCase();
                if (!emailDomain || !ALLOWED_UNT_DOMAINS.includes(emailDomain)) {
                    throw new Error(`Only UNT email addresses (@${ALLOWED_UNT_DOMAINS.join(", @")}) are allowed for registration.`);
                }

                return { body };
            },
        },
    },
    plugins: [
        emailOTP({
            overrideDefaultEmailVerification: true, // Use OTP instead of verification link
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({ email, otp, type }: { email: string; otp: string; type: "sign-in" | "email-verification" | "forget-password" }) {
                // TODO: Implement actual email sending service (e.g., Resend, SendGrid, Nodemailer)
                // For now, this is a placeholder that should be replaced with your email service
                console.log(`[EMAIL OTP] Type: ${type}, Email: ${email}, OTP: ${otp}`);
                
                // Example implementation placeholder:
                // await sendEmail({
                //     to: email,
                //     subject: type === "sign-in" 
                //         ? "Your Sign-In Verification Code" 
                //         : type === "email-verification"
                //         ? "Verify Your Email Address"
                //         : "Reset Your Password",
                //     html: `Your verification code is: <strong>${otp}</strong>`
                // });
            },
        }),
        nextCookies(), // nextCookies needs to be last
    ],
});
