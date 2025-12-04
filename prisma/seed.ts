import { PrismaClient } from '@prisma/client';
import { $Enums } from "@prisma/client";
import ListingStatus = $Enums.ListingStatus;
import ImageType = $Enums.ImageType;
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient()

async function main() {
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
    });

    const userEmma = await auth.api.signUpEmail({
        body: {
            name: "Emma Johnson",
            email: "emma.johnson@example.com",
            password: "tXn3bL2rV8pH5y",
            image: "https://example.com/images/emma.png",
            callbackURL: "https://example.com/callback",
        },
    });

    const userMichael = await auth.api.signUpEmail({
        body: {
            name: "Michael Brown",
            email: "michael.brown@example.com",
            password: "Pa9tLyXr3fQn7u",
            image: "https://example.com/images/michael.png",
            callbackURL: "https://example.com/callback",
        },
    });

    const userSophia = await auth.api.signUpEmail({
        body: {
            name: "Sophia Davis",
            email: "sophia.davis@example.com",
            password: "hT5uEr1bM9oK2v",
            image: "https://example.com/images/sophia.png",
            callbackURL: "https://example.com/callback",
        },
    });

    const userLiam = await auth.api.signUpEmail({
        body: {
            name: "Liam Wilson",
            email: "liam.wilson@example.com",
            password: "kN7tBv2rX3yP6q",
            image: "https://example.com/images/liam.png",
            callbackURL: "https://example.com/callback",
        },
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

    const catBooks = await prisma.category.upsert({
        where: { name: "Books" },
        create: { name: "Books", slug: "books" },
        update: {}
    });

    const catTV = await prisma.category.upsert({
        where: { name: "TV" },
        create: { name: "TV", slug: "tv" },
        update: {}
    });

    const catSchoolBags = await prisma.category.upsert({
        where: { name: "School Bags" },
        create: { name: "School Bags", slug: "school-bags" },
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
            ownerId: userJohn?.user.id,
            categories: { connect: [{ id: catTextbooks.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userEmma?.user.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userMichael?.user.id,
            categories: { connect: [{ id: catLaptops.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userSophia?.user.id,
            categories: { connect: [{ id: catNotes.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userLiam?.user.id,
            categories: { connect: [{ id: catTextbooks.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userEmma?.user.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userJohn?.user.id,
            categories: { connect: [{ id: catLaptops.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userSophia?.user.id,
            categories: { connect: [{ id: catTextbooks.id }, { id: catNotes.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userMichael?.user.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userLiam?.user.id,
            categories: { connect: [{ id: catLaptops.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userEmma?.user.id,
            categories: { connect: [{ id: catNotes.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
            ownerId: userJohn?.user.id,
            categories: { connect: [{ id: catSupplies.id }] },
            images: {
                create: [
                    { url: "sampleImage1.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage2.jpg", imageType: ImageType.LISTING },
                    { url: "sampleImage3.jpg", imageType: ImageType.LISTING }
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
                    i % 4 === 0 ? userJohn?.user.id :
                        i % 4 === 1 ? userEmma?.user.id :
                            i % 4 === 2 ? userMichael?.user.id :
                                userSophia?.user.id,
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
                        {url: "sampleImage1.jpg", imageType: ImageType.LISTING},
                        {url: "sampleImage2.jpg", imageType: ImageType.LISTING},
                        {url: "sampleImage3.jpg", imageType: ImageType.LISTING}
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
