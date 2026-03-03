import { PrismaClient } from "@prisma/client";
import { $Enums } from "@prisma/client";
import ListingStatus = $Enums.ListingStatus;
import ImageType = $Enums.ImageType;
import EventType = $Enums.EventType;
// Import Better Auth's own hashPassword so seeded passwords are
// hashed with the exact same algorithm the sign-in flow expects.
import { hashPassword } from "better-auth/crypto";
import { generateId } from "better-auth";

const prisma = new PrismaClient();

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function daysAgoStart(daysAgo: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Create a user + credential account directly in the database,
 * bypassing the Better Auth HTTP layer (and email-sending side-effects).
 */
async function createUser({
    name,
    email,
    password,
    emailVerified = true,
    role = "STUDENT",
    image,
}: {
    name: string;
    email: string;
    password: string;
    emailVerified?: boolean;
    role?: "STUDENT" | "ADMIN" | "FACULTY";
    image?: string;
}) {
    const userId = generateId();
    const accountId = generateId();
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            id: userId,
            name,
            email,
            emailVerified,
            role,
            image,
        },
    });

    await prisma.account.create({
        data: {
            id: accountId,
            accountId: userId,
            providerId: "credential",
            userId,
            password: hashedPassword,
        },
    });

    return user;
}

async function main() {
    // ---- Seed users ----
    const testUser = await createUser({
        name: "Test User",
        email: "test.user@my.unt.edu",
        password: "rootroot",
    });

    const adminUser = await createUser({
        name: "Admin",
        email: "admin@my.unt.edu",
        password: "testtest",
        role: "ADMIN",
    });

    const userJohn = await createUser({
        name: "John Smith",
        email: "john.smith@my.unt.edu",
        password: "XAvAyN9h4uFR7u",
        image: "https://example.com/images/john.png",
    });

    const userEmma = await createUser({
        name: "Emma Johnson",
        email: "emma.johnson@my.unt.edu",
        password: "tXn3bL2rV8pH5y",
        image: "https://example.com/images/emma.png",
    });

    const userMichael = await createUser({
        name: "Michael Brown",
        email: "michael.brown@my.unt.edu",
        password: "Pa9tLyXr3fQn7u",
        image: "https://example.com/images/michael.png",
    });

    const userSophia = await createUser({
        name: "Sophia Davis",
        email: "sophia.davis@my.unt.edu",
        password: "hT5uEr1bM9oK2v",
        image: "https://example.com/images/sophia.png",
    });

    const userLiam = await createUser({
        name: "Liam Wilson",
        email: "liam.wilson@my.unt.edu",
        password: "kN7tBv2rX3yP6q",
        image: "https://example.com/images/liam.png",
    });

    /**
     * Categories
     */
    const catTextbooks = await prisma.category.upsert({
        where: { name: "Textbooks" },
        create: { name: "Textbooks", slug: "textbooks" },
        update: {}
    });

    const catSupplies = await prisma.category.upsert({
        where: { name: "Supplies" },
        create: { name: "Supplies", slug: "supplies" },
        update: {}
    });

    const catLaptops = await prisma.category.upsert({
        where: { name: "Laptops" },
        create: { name: "Laptops", slug: "laptops" },
        update: {}
    });

    const catNotes = await prisma.category.upsert({
        where: { name: "Notes" },
        create: { name: "Notes", slug: "notes" },
        update: {}
    });

    /**
     * Listings
     */
    const adminAnalyticsListing = await prisma.listing.create({
        data: {
            title: "Admin Demo Listing - Analytics Enabled",
            description: "Demo listing owned by admin for analytics dashboard testing.",
            price: 99.99,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: adminUser.id,
            categories: { connect: [{ id: catTextbooks.id }, { id: catSupplies.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Calculus I Textbook",
            description: "Used Calculus I textbook in good condition, minimal notes inside.",
            price: 25.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userJohn.id,
            categories: { connect: [{ id: catTextbooks.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Mechanical Pencil Set",
            description: "Set of 3 mechanical pencils with refill leads.",
            price: 5.50,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userEmma.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Laptop Charger - Dell",
            description: "Compatible with Dell XPS series laptops.",
            price: 18.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userMichael.id,
            categories: { connect: [{ id: catLaptops.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Organic Chemistry Notes (Semester 2)",
            description: "Handwritten and digital notes, well-organized and color-coded.",
            price: 10.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userSophia.id,
            categories: { connect: [{ id: catNotes.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "College Algebra Textbook",
            description: "Slight wear on the cover, otherwise like new.",
            price: 15.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userLiam.id,
            categories: { connect: [{ id: catTextbooks.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Free Binder with Dividers",
            description: "A sturdy 3-ring binder with tabbed dividers. Free to whoever needs it!",
            price: 0,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userEmma.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "HP Laptop (Used)",
            description: "Lightly used HP laptop, 8GB RAM, 256GB SSD. Works great.",
            price: 220.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userJohn.id,
            categories: { connect: [{ id: catLaptops.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Physics II Textbook and Notes Bundle",
            description: "Includes textbook and handwritten notes from the semester.",
            price: 30.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userSophia.id,
            categories: { connect: [{ id: catTextbooks.id }, { id: catNotes.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Art Supplies Set",
            description: "A complete set including sketchpads, pencils, and paints.",
            price: 20.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: userMichael.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "MacBook Air 2020",
            description: "In excellent condition, used for one semester.",
            price: 450.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.ARCHIVED,
            ownerId: userLiam.id,
            categories: { connect: [{ id: catLaptops.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Statistics Notes (Digital Copy)",
            description: "Detailed PDF notes for introductory statistics.",
            price: 8.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.SOLD,
            ownerId: userEmma.id,
            categories: { connect: [{ id: catNotes.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    await prisma.listing.create({
        data: {
            title: "Engineering Notebook",
            description: "Hardcover engineering notebook with graph paper.",
            price: 6.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.DRAFT,
            ownerId: userJohn.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                ]
            }
        }
    });

    for (let i = 1; i <= 31; i++) {
        await prisma.listing.create({
            data: {
                title: `Extra Study Item #${i}`,
                description: "Additional seeded available listing.",
                price: 5 + i,
                isProfessorOnly: false,
                listingStatus: ListingStatus.AVAILABLE,
                ownerId:
                    i % 4 === 0 ? userJohn.id :
                        i % 4 === 1 ? userEmma.id :
                            i % 4 === 2 ? userMichael.id :
                                userSophia.id,
                categories: {
                    connect: [
                        {
                            id:
                                i % 4 === 0 ? catTextbooks.id :
                                    i % 4 === 1 ? catNotes.id :
                                        i % 4 === 2 ? catSupplies.id :
                                            catLaptops.id
                        }
                    ]
                },
                images: {
                    create: [
                        { url: "/sampleImage1.jpg", imageType: ImageType.LISTING },
                        { url: "/sampleImage2.jpg", imageType: ImageType.LISTING },
                        { url: "/sampleImage3.jpg", imageType: ImageType.LISTING }
                    ]
                }
            }
        });
    }

    // Seed analytics for the admin-owned listing (last 90 days).
    // Because ListingEvent is deduped by (sessionId, listingId, eventType, createdAt),
    // we create unique sessionIds per event instance to model volume.
    const analyticsRows: {
        listingId: string;
        userId: string | null;
        sessionId: string;
        eventType: EventType;
        createdAt: Date;
    }[] = [];

    const analyticsWindowDays = 90;

    for (let dayOffset = analyticsWindowDays - 1; dayOffset >= 0; dayOffset--) {
        const date = startOfDay(daysAgoStart(dayOffset));

        // Randomized daily volume
        const impressions = 20 + Math.floor(Math.random() * 81); // 20..100
        const viewRate = 0.35 + Math.random() * 0.4; // 35%..75%
        const contactRate = 0.08 + Math.random() * 0.22; // 8%..30%

        const views = Math.max(1, Math.floor(impressions * viewRate));
        const contacts = Math.max(0, Math.floor(views * contactRate));

        for (let i = 0; i < impressions; i++) {
            analyticsRows.push({
                listingId: adminAnalyticsListing.id,
                userId: null,
                sessionId: `seed-admin-imp-${dayOffset}-${i}`,
                eventType: EventType.LISTING_IMPRESSION,
                createdAt: date,
            });
        }

        for (let i = 0; i < views; i++) {
            analyticsRows.push({
                listingId: adminAnalyticsListing.id,
                userId: null,
                sessionId: `seed-admin-view-${dayOffset}-${i}`,
                eventType: EventType.LISTING_VIEW,
                createdAt: date,
            });
        }

        for (let i = 0; i < contacts; i++) {
            analyticsRows.push({
                listingId: adminAnalyticsListing.id,
                userId: null,
                sessionId: `seed-admin-contact-${dayOffset}-${i}`,
                eventType: EventType.CONTACT_SELLER,
                createdAt: date,
            });
        }
    }

    await prisma.listingEvent.createMany({
        data: analyticsRows,
        skipDuplicates: true,
    });

    console.log("✅ Seed complete.");
    console.log(`   test.user@my.unt.edu  / rootroot`);
    console.log(`   admin@my.unt.edu      / testtest  (ADMIN)`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

