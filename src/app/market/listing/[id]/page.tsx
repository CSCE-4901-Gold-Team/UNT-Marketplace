import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const prisma = new PrismaClient();

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
        where: {
            id: id
        },
        include: {
            owner: {
                select: {
                    name: true,
                    email: true,
                }
            },
            categories: {
                select: {
                    id: true,
                    name: true,
                }
            },
            images: {
                select: {
                    id: true,
                    url: true,
                }
            }
        }
    });

    await prisma.$disconnect();

    if (!listing) {
        notFound();
    }

    return (
        <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
            <div className="w-full max-w-4xl mx-auto">
                <Link href="/market" className="text-green hover:underline mb-4 inline-block">
                    ← Back to all listings
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-4xl font-bold mb-4 dark:text-white">{listing.title}</h1>

                    {/* Image Display */}
                    {listing.images.length > 0 && (
                        <div className="mb-6 relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <Image
                                src={listing.images[0].url}
                                alt={listing.title}
                                fill
                                className="object-cover"
                                priority
                                unoptimized
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6 pb-6 border-b dark:border-gray-700">
                        <span className="text-4xl font-bold text-green">${listing.price.toString()}</span>
                        {listing.isProfessorOnly && (
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded">
                                Professor Only
                            </span>
                        )}
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2 dark:text-white">Description</h2>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{listing.description}</p>
                    </div>

                    {listing.categories.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2 dark:text-white">Categories</h2>
                            <div className="flex flex-wrap gap-2">
                                {listing.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded">
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t dark:border-gray-700 pt-6 mt-6">
                        <h2 className="text-xl font-semibold mb-4 dark:text-white">Seller Information</h2>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                            <p className="font-medium dark:text-white">{listing.owner.name}</p>
                            <p className="text-gray-600 dark:text-gray-400">{listing.owner.email}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Posted: {new Date(listing.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button className="flex-1 bg-green text-white py-3 rounded-lg hover:opacity-90">
                            Contact Seller
                        </button>
                        <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
