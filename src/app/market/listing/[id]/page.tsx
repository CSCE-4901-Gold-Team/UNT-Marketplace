import { notFound } from "next/navigation";
import Link from "next/link";
import ListingDetailClient from "./ListingDetailClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ImageCarousel from "@/components/ui/ImageCarousel";
import { Suspense } from "react";
import ListingSuccessToast from "@/components/ui/ListingSuccessToast";
import { prisma } from "@/lib/prisma";

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });
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
                    sortOrder: true,
                },
                orderBy: {
                    sortOrder: 'asc',
                }
            }
        }
    });

    if (!listing) {
        notFound();
    }

    const isOwner = session?.user?.id === listing.ownerId;

    return (
        <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
            <Suspense fallback={null}>
                <ListingSuccessToast />
            </Suspense>
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
                        <h2 className="text-xl font-semibold mb-2">Categories</h2>
                        <div className="flex flex-wrap gap-2">
                            {listing.categories.map((category) => (
                                <span
                                    key={category.id}
                                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded"
                                >
                                    {category.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                    {!isOwner && (
                        <div className="flex gap-4 mt-6">
                            <button className="flex-1 bg-green text-white py-3 rounded-lg hover:opacity-90">
                                Contact Seller
                            </button>
                            <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Share
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
