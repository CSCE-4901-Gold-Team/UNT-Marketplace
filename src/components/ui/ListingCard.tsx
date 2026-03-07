"use client"

import {ListingObject} from "@/models/ListingObject";
import Link from "next/link";
import Image from "next/image";

export default function ListingCard({
    listing
}: {
    listing: ListingObject
}) {

    const listingPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(listing.price);

    const listingUrl = `/market/listing/${listing.id}`;
    const hasValidImage = listing.images.length > 0 && listing.images[0].url;
    const listingTitle = listing.isDeniedByAdmin
        ? `${listing.title} (DENIED)`
        : listing.listingStatus === "DRAFT" && listing.isPendingApproval
            ? `${listing.title} (PENDING)`
            : listing.title;

    return (
        <div className="listing group relative">
            <div className="listing-image w-full">
                <div className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] w-full bg-gray-300 dark:bg-gray-700 rounded-sm overflow-hidden group-hover:shadow-lg transition-all duration-500 ease-in-out relative">
                    {hasValidImage ? (
                        <Image
                            src={`${listing.images[0].url}`}
                            alt={listing.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                            unoptimized
                            priority={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="listing-info mt-1">
                <p className="font-bold text-base sm:text-lg text-black dark:text-white">
                    {listingPrice}
                </p>
                <p className="text-sm sm:text-base text-black dark:text-white truncate">{listing.title}</p>
            </div>
            <Link href={listingUrl} className="top-0 left-0 right-0 bottom-0 absolute"></Link>
        </div>
    );
}
