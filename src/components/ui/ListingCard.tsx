"use client"

import {useMemo, useState} from "react";
import {ListingObject} from "@/models/ListingObject";
import Link from "next/link";
import Image from "next/image";

export default function ListingCard({
    listing,
    currentUserId,
}: {
    listing: ListingObject,
    currentUserId: string,
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const listingPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(listing.price);
    const postedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(listing.createdAt));

    const listingUrl = `/market/listing/${listing.id}`;
    const sortedImages = useMemo(
        () => listing.images
            .filter((image) => Boolean(image.url))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        [listing.images]
    );
    const hasValidImage = sortedImages.length > 0;
    const currentImage = hasValidImage ? sortedImages[currentImageIndex] : null;
    const isOwner = listing.ownerId === currentUserId;
    const editListingUrl = `/market/create-listing?edit=true&id=${listing.id}`;
    const listingTitle = listing.isDeniedByAdmin
        ? `${listing.title} (DENIED)`
        : listing.listingStatus === "DRAFT" && listing.isPendingApproval
            ? `${listing.title} (PENDING)`
            : listing.title;

    const showCarouselControls = sortedImages.length > 1;

    const showPreviousImage = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
    };

    const showNextImage = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
    };

    return (
        <div className="listing group relative">
            <div className="listing-image">
                <div className="h-[350px] bg-gray-300 rounded-sm overflow-hidden group-hover:shadow-lg transition-all duration-500 ease-in-out relative">
                    {hasValidImage ? (
                        <Image
                            src={currentImage!.url}
                            alt={`${listing.title} image ${currentImageIndex + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-300" />
                    )}

                    {showCarouselControls && (
                        <>
                            <button
                                type="button"
                                onClick={showPreviousImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/55 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Previous image for ${listing.title}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={showNextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/55 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Next image for ${listing.title}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <div className="absolute top-2 right-2 z-20 bg-black/55 text-white text-xs px-2 py-1 rounded-full">
                                {currentImageIndex + 1}/{sortedImages.length}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="listing-info mt-1">
                <p className="font-bold text-lg">
                    {listingPrice}
                </p>
                <p>{listingTitle}</p>
                <p className="text-sm text-gray-500">Posted {postedDate}</p>
            </div>

            {isOwner && (
                <Link
                    href={editListingUrl}
                    className="absolute bottom-2 right-2 z-30 rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    Edit
                </Link>
            )}

            <Link
                href={listingUrl}
                aria-label={`Open ${listing.title}`}
                className="absolute inset-0 z-10"
            />
        </div>
    );
}
