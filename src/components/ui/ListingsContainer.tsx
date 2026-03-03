"use client"

import {ListingObject} from "@/models/ListingObject";
import ListingCard from "@/components/ui/ListingCard";

export default function ListingsContainer({
    listings,
}: {
    listings: ListingObject[],
}) {

    return (
        <div className="listing-container items-start grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {
                listings.map(listing =>
                    <ListingCard key={listing.id} listing={listing}/>
                )
            }
        </div>
    );
}
