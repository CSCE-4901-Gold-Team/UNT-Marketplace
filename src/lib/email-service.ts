import sgMail from "@sendgrid/mail";

// ------------------------------------
// SendGrid Configuration
// ------------------------------------
const getSendGridClient = () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
        throw new Error("SENDGRID_API_KEY environment variable is not set");
    }
    sgMail.setApiKey(apiKey);
    return sgMail;
};

const getFromEmail = (): string => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;
    if (!fromEmail) {
        throw new Error(
            "SENDGRID_FROM_EMAIL (or SMTP_FROM_EMAIL) environment variable is not set"
        );
    }
    return fromEmail;
};

const getFromName = (): string => {
    return process.env.SENDGRID_FROM_NAME || process.env.SMTP_FROM_NAME || "UNT Marketplace";
};

// ------------------------------------
// Retry Utility
// ------------------------------------
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> => {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const isTransient =
                lastError.message.includes("ETIMEDOUT") ||
                lastError.message.includes("ECONNREFUSED") ||
                lastError.message.includes("429") ||
                lastError.message.includes("500") ||
                lastError.message.includes("502") ||
                lastError.message.includes("503");

            if (!isTransient || i === retries - 1) {
                throw lastError;
            }

            const waitTime = delay * Math.pow(2, i);
            console.log(
                `⏳ Retry attempt ${i + 1}/${retries} after ${waitTime}ms due to: ${lastError.message}`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }

    throw lastError || new Error("Unknown error");
};

// ------------------------------------
// Send Verification Email
// ------------------------------------
export const sendVerificationEmail = async (email: string, url: string) => {
    console.log("📧 Sending email verification to:", email);
    console.log("🔗 Verification URL:", url);

    try {
        await retryWithBackoff(async () => {
            const client = getSendGridClient();
            const fromEmail = getFromEmail();
            const fromName = getFromName();

            const msg = {
                to: email,
                from: {
                    email: fromEmail,
                    name: fromName,
                },
                subject: "Verify your UNT Marketplace account",
                text: `Welcome to UNT Marketplace! Click this link to verify your email: ${url}\n\nThis link will expire in 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #3B9842; margin: 0;">Welcome to UNT Marketplace!</h2>
                        </div>
                        <p style="color: #333; line-height: 1.6;">Thank you for signing up. Please click the button below to verify your email address:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${url}" style="display: inline-block; padding: 12px 30px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                        <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px; margin: 10px 0;">If you didn't create an account, you can safely ignore this email.</p>
                        <p style="color: #999; font-size: 12px; margin: 10px 0;">⏱️ This link will expire in 5 minutes.</p>
                    </div>
                `,
            };

            await client.send(msg);
            console.log("✅ Verification email sent successfully via SendGrid");
            return { success: true };
        });

        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send verification email via SendGrid:", error);
        console.error("📧 SendGrid configuration diagnostic:");
        console.error(
            "  - SENDGRID_API_KEY:",
            process.env.SENDGRID_API_KEY ? "✅ Set" : "❌ Missing"
        );
        console.error(
            "  - SENDGRID_FROM_EMAIL:",
            process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL
                ? "✅ Set"
                : "❌ Missing"
        );
        console.error(
            "  - Error message:",
            error instanceof Error ? error.message : String(error)
        );
        // Don't throw - allow registration to continue even if email fails
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

// ------------------------------------
// Send Password Reset Email
// ------------------------------------
export const sendPasswordResetEmail = async (email: string, url: string) => {
    console.log("📧 Sending password reset to:", email);

    try {
        await retryWithBackoff(async () => {
            const client = getSendGridClient();
            const fromEmail = getFromEmail();
            const fromName = getFromName();

            const msg = {
                to: email,
                from: {
                    email: fromEmail,
                    name: fromName,
                },
                subject: "Reset your UNT Marketplace password",
                text: `You requested to reset your password. Visit this link to set a new password: ${url}\n\nThis link will expire in 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #3B9842; margin: 0;">Reset Your Password</h2>
                        </div>
                        <p style="color: #333; line-height: 1.6;">You requested to reset your password. Click the button below to set a new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${url}" style="display: inline-block; padding: 12px 30px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                        <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px; margin: 10px 0;">If you didn't request a password reset, you can safely ignore this email.</p>
                        <p style="color: #999; font-size: 12px; margin: 10px 0;">⏱️ This link will expire in 5 minutes.</p>
                    </div>
                `,
            };

            await client.send(msg);
            console.log("✅ Password reset email sent successfully via SendGrid");
            return { success: true };
        });

        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send password reset email via SendGrid:", error);
        // Don't throw - allow the password reset flow to continue
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

// ------------------------------------
// Send Query Digest Email
// ------------------------------------
export interface ListingForDigest {
    id: string;
    title: string;
    description: string;
    price: string;
    categoryNames: string[];
    images: { url: string }[];
}

export const sendQueryDigestEmail = async (
    email: string,
    queryName: string,
    listings: ListingForDigest[]
) => {
    console.log(`📧 Sending query digest for "${queryName}" to:`, email);
    console.log(`📊 Found ${listings.length} matching listings`);

    try {
        await retryWithBackoff(async () => {
            const client = getSendGridClient();
            const fromEmail = getFromEmail();
            const fromName = getFromName();

            // Build listings HTML
            const listingsHtml = listings
                .map(
                    (listing) => `
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f9f9f9;">
                    <div style="display: flex; gap: 16px;">
                        ${listing.images.length > 0 ? `<div style="flex-shrink: 0; width: 100px; height: 100px; border-radius: 4px; overflow: hidden; background-color: #ddd;">
                            <img src="${listing.images[0].url}" alt="${listing.title}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>` : ''}
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${listing.title}</h3>
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; line-height: 1.4;">${listing.description.substring(0, 150)}${listing.description.length > 150 ? '...' : ''}</p>
                            ${listing.categoryNames.length > 0 ? `<p style="margin: 0 0 8px 0; color: #999; font-size: 12px;"><strong>Categories:</strong> ${listing.categoryNames.join(', ')}</p>` : ''}
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <p style="margin: 0; color: #3B9842; font-size: 18px; font-weight: bold;">\$${parseFloat(listing.price).toFixed(2)}</p>
                                <a href="https://unt-marketplace.com/market/listing/${listing.id}" style="display: inline-block; padding: 8px 16px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">View Listing</a>
                            </div>
                        </div>
                    </div>
                </div>
            `
                )
                .join('');

            const msg = {
                to: email,
                from: {
                    email: fromEmail,
                    name: fromName,
                },
                subject: `New listings matching "${queryName}" - UNT Marketplace`,
                text: `Found ${listings.length} new listings matching your saved query "${queryName}" today.\n\nVisit UNT Marketplace to view all matching listings.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #3B9842; margin: 0;">New Listings Found!</h2>
                            <p style="color: #666; margin: 8px 0 0 0;">Matching your saved search: <strong>${queryName}</strong></p>
                        </div>
                        <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">Good news! We found <strong>${listings.length}</strong> new listing${listings.length !== 1 ? 's' : ''} matching your saved query today.</p>
                        <div style="margin: 30px 0;">
                            ${listingsHtml}
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://unt-marketplace.com/market" style="display: inline-block; padding: 12px 30px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View All Listings</a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <div style="color: #999; font-size: 12px;">
                            <p style="margin: 10px 0;">You received this email because you saved a search query on UNT Marketplace.</p>
                            <p style="margin: 10px 0;">Want to manage your saved searches? Log in to your account to enable or disable notifications.</p>
                        </div>
                    </div>
                `,
            };

            await client.send(msg);
            console.log(`✅ Query digest email sent successfully via SendGrid`);
            return { success: true };
        });

        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send query digest email via SendGrid:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};
