import { prisma } from "@/lib/prisma";
import { sendQueryDigestEmail, ListingForDigest } from "@/lib/email-service";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Process all enabled saved queries and send email digests for queries
 * with matching listings posted today
 */
export async function processSavedQueries() {
    console.log("🔄 Starting saved query processing...");

    try {
        // Get all enabled saved queries
        const savedQueries = await prisma.savedQuery.findMany({
            where: { enabled: true },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        console.log(`📊 Found ${savedQueries.length} enabled saved queries`);

        let processedCount = 0;
        let emailsSentCount = 0;

        for (const query of savedQueries) {
            try {
                const emailSent = await processSingleQuery(query);
                if (emailSent) {
                    emailsSentCount++;
                }
                processedCount++;
            } catch (error) {
                console.error(`❌ Error processing query ${query.id}:`, error);
                processedCount++;
            }
        }

        console.log(
            `✅ Completed processing ${processedCount} queries, sent ${emailsSentCount} emails`
        );

        return {
            success: true,
            processedQueries: processedCount,
            emailsSent: emailsSentCount,
        };
    } catch (error) {
        console.error("❌ Error in processSavedQueries:", error);
        throw error;
    }
}

/**
 * Process a single saved query and send email if matching listings found
 */
async function processSingleQuery(query: any): Promise<boolean> {
    console.log(`\n🔍 Processing query: "${query.name}" for user ${query.user.email}`);

    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build filter conditions
    const where: any = {
        listingStatus: "AVAILABLE",
        createdAt: {
            gte: today,
            lt: tomorrow,
        },
    };

    // Add search term filter if present
    if (query.searchTerm) {
        where.OR = [
            {
                title: {
                    search: query.searchTerm,
                },
            },
            {
                description: {
                    search: query.searchTerm,
                },
            },
        ];
    }

    // Add price range filter if present
    if (query.minPrice) {
        where.price = where.price || {};
        where.price.gte = query.minPrice;
    }

    if (query.maxPrice) {
        where.price = where.price || {};
        where.price.lte = query.maxPrice;
    }

    // Add category filter if present
    if (query.categories.length > 0) {
        const categoryIds = query.categories.map((cat: any) => cat.category.id);
        where.categories = {
            some: {
                id: {
                    in: categoryIds,
                },
            },
        };
    }

    // Find matching listings
    const matchingListings = await prisma.listing.findMany({
        where,
        include: {
            images: {
                select: {
                    url: true,
                },
                take: 1,
            },
            categories: {
                select: {
                    name: true,
                },
            },
        },
    });

    console.log(
        `📋 Found ${matchingListings.length} matching listings for query "${query.name}"`
    );

    // Only send email if there are matching listings
    if (matchingListings.length > 0) {
        const listingsForEmail: ListingForDigest[] = matchingListings.map(
            (listing) => ({
                id: listing.id,
                title: listing.title,
                description: listing.description,
                price: (listing.price as Decimal).toString(),
                categoryNames: listing.categories.map((cat) => cat.name),
                images: listing.images,
            })
        );

        const emailResult = await sendQueryDigestEmail(
            query.user.email,
            query.name,
            listingsForEmail
        );

        if (emailResult.success) {
            console.log(`✅ Email sent to ${query.user.email}`);

            // Update last email sent timestamp
            await prisma.savedQuery.update({
                where: { id: query.id },
                data: { lastEmailSentAt: new Date() },
            });

            // Log notification
            await prisma.queryNotificationLog.create({
                data: {
                    queryId: query.id,
                    listingCount: matchingListings.length,
                    recipientEmail: query.user.email,
                    status: "sent",
                },
            });

            return true;
        } else {
            console.error(
                `❌ Failed to send email to ${query.user.email}:`,
                emailResult.error
            );

            await prisma.queryNotificationLog.create({
                data: {
                    queryId: query.id,
                    listingCount: 0,
                    recipientEmail: query.user.email,
                    status: "failed",
                },
            });

            return false;
        }
    } else {
        console.log(
            `⏭️ No matching listings found for query "${query.name}", skipping email`
        );
        return false;
    }
}

/**
 * API endpoint to trigger the saved query processing
 * GET /api/cron/process-saved-queries
 *
 * Can be called by:
 * - External cron services (Vercel Crons, EasyCron, etc.)
 * - Scheduled jobs on the server
 * - Manual API calls during development
 */
export async function GET(request: Request) {
    try {
        // In production, verify the request is from a trusted cron service
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401 }
            );
        }

        const result = await processSavedQueries();

        return new Response(
            JSON.stringify(result),
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Error in cron endpoint:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to process saved queries",
                message: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500 }
        );
    }
}
