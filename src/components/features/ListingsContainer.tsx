"use client"

import React, {use} from "react";
import {ListingReturnType} from "@/models/ListingReturnType";
import ListingCard from "@/components/ui/ListingCard";

export default function ListingsContainer({
    listings,
}: {
    listings: ListingReturnType[],
}) {

    return (
        <div className="listing-container items-start grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
            {
                listings.map(listing =>
                    <ListingCard key={listing.id} listing={listing}/>
                )
            }
        </div>
    );
}
