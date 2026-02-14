import { PrismaClient } from "@prisma/client";
import { $Enums } from "@prisma/client";
import ListingStatus = $Enums.ListingStatus;
import ImageType = $Enums.ImageType;
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient()

async function main() {
   // Verify all existing users first
    await prisma.user.updateMany({
        data: {
            emailVerified: true
        }
    });

    const testUser = await auth.api.signUpEmail({
        body: {
            name: "Test User",
            email: "test.user@my.unt.edu",
            password: "rootroot",
        },
    }).catch(() => null);

    if (testUser) {
        await prisma.user.update({
            where: {
                id: testUser.user.id
            },
            data: {
                emailVerified: true
            }
        });
    }

    /**
     * Users
     */
    const userJohn = await auth.api.signUpEmail({
        body: {
            name: "John Smith",
            email: "john.smith@example.com",
            password: "XAvAyN9h4uFR7u",
            image: "https://example.com/images/john.png",
            callbackURL: "https://example.com/callback",
        },
    }).catch(() => null);
    if (userJohn) {
        await prisma.user.update({
            where: { id: userJohn.user.id },
            data: { emailVerified: true }
        });
    }

    const userEmma = await auth.api.signUpEmail({
        body: {
            name: "Emma Johnson",
            email: "emma.johnson@example.com",
            password: "tXn3bL2rV8pH5y",
            image: "https://example.com/images/emma.png",
            callbackURL: "https://example.com/callback",
        },
    }).catch(() => null);
    if (userEmma) {
        await prisma.user.update({
            where: { id: userEmma.user.id },
            data: { emailVerified: true }
        });
    }

    const userMichael = await auth.api.signUpEmail({
        body: {
            name: "Michael Brown",
            email: "michael.brown@example.com",
            password: "Pa9tLyXr3fQn7u",
            image: "https://example.com/images/michael.png",
            callbackURL: "https://example.com/callback",
        },
    }).catch(() => null);
    if (userMichael) {
        await prisma.user.update({
            where: { id: userMichael.user.id },
            data: { emailVerified: true }
        });
    }

    const userSophia = await auth.api.signUpEmail({
        body: {
            name: "Sophia Davis",
            email: "sophia.davis@example.com",
            password: "hT5uEr1bM9oK2v",
            image: "https://example.com/images/sophia.png",
            callbackURL: "https://example.com/callback",
        },
    }).catch(() => null);
    if (userSophia) {
        await prisma.user.update({
            where: { id: userSophia.user.id },
            data: { emailVerified: true }
        });
    }

    const userLiam = await auth.api.signUpEmail({
        body: {
            name: "Liam Wilson",
            email: "liam.wilson@example.com",
            password: "kN7tBv2rX3yP6q",
            image: "https://example.com/images/liam.png",
            callbackURL: "https://example.com/callback",
        },
    }).catch(() => null);
    if (userLiam) {
        await prisma.user.update({
            where: { id: userLiam.user.id },
            data: { emailVerified: true }
        });
    }

    /**
     * Users - Get existing users by email
     */
    const john = await prisma.user.findUnique({ where: { email: "john.smith@example.com" } });
    const emma = await prisma.user.findUnique({ where: { email: "emma.johnson@example.com" } });
    const michael = await prisma.user.findUnique({ where: { email: "michael.brown@example.com" } });
    const sophia = await prisma.user.findUnique({ where: { email: "sophia.davis@example.com" } });
    const liam = await prisma.user.findUnique({ where: { email: "liam.wilson@example.com" } });

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
    await prisma.listing.create({
        data: {
            title: "Calculus I Textbook",
            description: "Used Calculus I textbook in good condition, minimal notes inside.",
            price: 25.00,
            isProfessorOnly: false,
            listingStatus: ListingStatus.AVAILABLE,
            ownerId: john?.id!,
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
            ownerId: emma?.id!,
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
            ownerId: michael?.id!,
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
            ownerId: sophia?.id!,
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
            ownerId: liam?.id!,
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
            ownerId: emma?.id!,
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
            ownerId: john?.id!,
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
            ownerId: sophia?.id!,
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
            ownerId: michael?.id!,
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
            ownerId: liam?.id!,
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
            ownerId: emma?.id!,
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
            ownerId: john?.id!,
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
                    i % 4 === 0 ? john?.id! :
                        i % 4 === 1 ? emma?.id! :
                            i % 4 === 2 ? michael?.id! :
                                sophia?.id!,
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
                        {url: "/sampleImage1.jpg", imageType: ImageType.LISTING},
                        {url: "/sampleImage2.jpg", imageType: ImageType.LISTING},
                        {url: "/sampleImage3.jpg", imageType: ImageType.LISTING}
                    ]
                }
            }
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
