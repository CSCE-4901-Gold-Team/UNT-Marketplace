"use client"

import React, {use} from "react";
import {Prisma} from "@/generated/prisma";
import {ListingReturnType} from "@/models/ListingReturnType";

export default function ListingsContainer({
    listingsResponse,
}: {
    listingsResponse: Promise<ListingReturnType[]>,
}) {
    const listings = use(listingsResponse);

    return (
        <div className="listing-container grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
            {
                listings.map(listing =>
                    <div className="listing" key={listing.id}>
                        <div className="listing-image">
                            <div className="h-[350px] bg-gray-300 rounded-sm bg-center bg-cover"
                                 style={{backgroundImage: `url(images/${listing.images[0].url})`}}
                            ></div>
                        </div>
                        <div className="listing-info mt-1">
                            <p className="font-bold text-lg">
                                {
                                    new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                    }).format(listing.price)
                                }
                            </p>
                            <p>{listing.title}</p>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
