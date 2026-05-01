import { notFound } from "next/navigation";
import Link from "next/link";
import ListingDetailClient from "./ListingDetailClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ImageCarousel from "@/components/ui/ImageCarousel";
import { Suspense } from "react";
import ListingSuccessToast from "@/components/ui/ListingSuccessToast";
import { prisma } from "@/lib/prisma";
import ListingLocationMap from "@/components/ui/ListingLocationMap";
import { MessageProfanityFlagStatus } from "@prisma/client";

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const [listing, viewerPrefs] = await Promise.all([
        prisma.listing.findUnique({
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
                },
                listingProfanityFlags: {
                    where: { status: MessageProfanityFlagStatus.REVIEWED_NO_ACTION },
                    orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
                    select: {
                        originalTitle: true,
                        originalDescription: true,
                    },
                    take: 1,
                },
            }
        }),
        session?.user?.id
            ? prisma.user.findUnique({
                where: { id: session.user.id },
                select: { allowMatureListingContent: true },
            })
            : Promise.resolve(null),
    ]);

    if (!listing) {
        notFound();
    }

    const isOwner = session?.user?.id === listing.ownerId;
    const releasedProfanityRow = listing.listingProfanityFlags[0];
    const allowMature = viewerPrefs?.allowMatureListingContent ?? false;
    const displayTitle =
        releasedProfanityRow && allowMature
            ? releasedProfanityRow.originalTitle
            : listing.title;
    const displayDescription =
        releasedProfanityRow && allowMature
            ? releasedProfanityRow.originalDescription
            : listing.description;
    const blurListingImages = Boolean(releasedProfanityRow) && !allowMature;

    const postedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(listing.createdAt));

    return (
        <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
            <Suspense fallback={null}>
                <ListingSuccessToast />
            </Suspense>
            <div className="w-full max-w-4xl mx-auto">
                <Link href="/market" className="text-green hover:underline mb-4 inline-block">
                    ← Back to all listings
                </Link>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-4xl font-bold">{displayTitle}</h1>
                            <p className="text-sm text-gray-500 mt-2">Posted {postedDate}</p>
                        </div>
                        {isOwner && (
                            <div className="flex gap-2">
                                <Link
                                    href={`/market/listing/${listing.id}/analytics`}
                                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                                >
                                    View Analytics
                                </Link>
                                <Link 
                                    href={`/market/create-listing?edit=true&id=${listing.id}`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Edit
                                </Link>
                            </div>
                        )}
                    </div>
                    
                    {/* Image Carousel */}
                    <ImageCarousel
                        images={listing.images}
                        alt={displayTitle}
                        blurImages={blurListingImages}
                    />
                    {blurListingImages ? (
                        <p className="text-sm text-gray-500 mb-6 -mt-2">
                            This listing matched the profanity filter and was cleared by a moderator; the public
                            listing stays censored unless you enable the 18+ option in{" "}
                            <Link href="/profile" className="text-green underline hover:no-underline">
                                Account → Profile Settings
                            </Link>
                            .
                        </p>
                    ) : null}

                    <div className="flex items-center justify-between mb-6 pb-6 border-b">
                        <span className="text-4xl font-bold text-green">${listing.price.toString()}</span>
                        {listing.isProfessorOnly && (
                            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
                                Professor Only
                            </span>
                        )}
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Description</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{displayDescription}</p>
                    </div>

                    {listing.pickupAddress && (
                        <div className="mb-6">
                            <ListingLocationMap address={listing.pickupAddress} />
                        </div>
                    )}

                {listing.categories.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Categories</h2>
                        <div className="flex flex-wrap gap-2">
                            {listing.categories.map((category: { id: number; name: string }) => (
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
                    <ListingDetailClient listingId={id} isOwner={isOwner} />
                </div>
            </div>
        </main>
    );
}
