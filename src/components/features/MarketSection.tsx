"use client"

import {ListingReturnType} from "@/models/ListingReturnType";
import {use} from "react";
import ListingsContainer from "@/components/features/ListingsContainer";

export default function MarketSection({
    listingsResponse
}: {
    listingsResponse: Promise<ListingReturnType[]>;
}) {
    const listings: ListingReturnType[] = use(listingsResponse);

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <ListingsContainer listings={listings} />
        </main>
    );
}
