"use client"

import {ListingReturnType} from "@/models/ListingReturnType";
import Link from "next/link";

export default function ListingCard({
    listing
}: {
    listing: ListingReturnType
}) {

    const listingBackground = listing.images.length > 0 ?
        `url(images/${listing.images[0].url}) center center / cover no-repeat, #d1d5dc` : "#d1d5dc";

    const listingPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(listing.price);

    const listingUrl = `/market/listing/${listing.id}`;

    return (
        <div className="listing group relative">
            <div className="listing-image">
                <div className="h-[350px] bg-gray-300 rounded-sm bg-center bg-cover group-hover:shadow-lg group-hover:scale-101 transition-all duration-500 ease-in-out"
                     style={{background: listingBackground}}
                ></div>
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
