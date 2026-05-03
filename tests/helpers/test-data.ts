import { prisma } from "../../src/lib/prisma";
import { imageAdapter } from "../../src/lib/image-adapter";
import { ImageType } from "@/prisma/generated";

export interface SeedListingResult {
    listingId: string;
    imagePaths: string[];
}

/**
 * Creates a listing directly via Prisma for use in E2E tests.
 * Bypasses the UI/server-action layer so tests control the data state.
 */
export async function seedTestListing({
    ownerId,
    title = "Test Listing",
    description = "Seeded for E2E testing",
    price = 29.99,
    numImages = 1,
    categoryId,
}: {
    ownerId: string;
    title?: string;
    description?: string;
    price?: number;
    numImages?: number;
    categoryId?: number;
}): Promise<SeedListingResult> {
    const listing = await prisma.listing.create({
        data: {
            title,
            description,
            price,
            listingStatus: "AVAILABLE",
            ownerId,
            ...(categoryId ? { categories: { connect: [{ id: categoryId }] } } : {}),
        },
    });

    const imagePaths: string[] = [];

    for (let i = 0; i < numImages; i++) {
        const buffer = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "base64",
        );

        const result = await imageAdapter.saveFromBuffer(buffer, `test-image-${i}.png`, {
            type: "listing",
        });

        imagePaths.push(result);

        await prisma.image.create({
            data: {
                url: result,
                listingId: listing.id,
                imageType: ImageType.LISTING,
                sortOrder: i,
            },
        });
    }

    return { listingId: listing.id, imagePaths };
}

/**
 * Deletes a listing and its associated disk files.
 */
export async function cleanupTestListing(listingId: string, imagePaths: string[]) {
    try {
        // Check if listing still exists before cleanup
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) return; // Already deleted by the test

        // Delete all dependent records to avoid foreign key constraints
        await prisma.$transaction([
            prisma.image.deleteMany({ where: { listingId } }),
            prisma.listingEvent.deleteMany({ where: { listingId } }),
            prisma.listingProfanityFlag.deleteMany({ where: { listingId } }),
            prisma.report.deleteMany({ where: { listingId } }),
            prisma.conversation.deleteMany({ where: { listingId } }),
        ]);

        // Delete disk files (only the ones we know about; new ones from edits may exist)
        await imageAdapter.deleteListingFiles(imagePaths);

        await prisma.listing.delete({
            where: { id: listingId },
        });
    } catch (error) {
        if (error instanceof Error) {
            console.warn("Warning during test cleanup:", error.message);
        }
    }
}

/**
 * Returns the admin user ID.
 */
export async function getAdminUserId(): Promise<string> {
    const user = await prisma.user.findFirst({
        where: { email: "admin@my.unt.edu" },
        select: { id: true },
    });

    if (!user) {
        throw new Error("Admin user not found. Run seed script first.");
    }

    return user.id;
}

/**
 * Returns the first category ID.
 */
export async function getFirstCategoryId(): Promise<number> {
    const category = await prisma.category.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
    });

    if (!category) {
        throw new Error("No categories found. Run seed script first.");
    }

    return category.id;
}
