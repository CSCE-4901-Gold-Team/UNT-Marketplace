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

    return (
        <div className="listing group relative">
            <div className="listing-image">
                <div className="h-[350px] bg-gray-300 rounded-sm overflow-hidden group-hover:shadow-lg transition-all duration-500 ease-in-out relative">
                    {hasValidImage ? (
                        <Image
                            src={`images/${listing.images[0].url}`}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-300" />
                    )}
                </div>
            </div>
            <div className="listing-info mt-1">
                <p className="font-bold text-lg">
                    {listingPrice}
                </p>
                <p>{listing.title}</p>
            </div>
            <Link href={listingUrl} className="top-0 left-0 right-0 bottom-0 absolute"></Link>
        </div>
    );
}
