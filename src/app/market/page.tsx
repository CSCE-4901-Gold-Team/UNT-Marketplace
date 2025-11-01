"use server"

import {Suspense} from "react";
import {getListings} from "@/actions/listing-actions";
import ListingsContainer from "@/components/features/ListingsContainer";
import MarketSuspense from "@/components/suspense/MarketSuspense";

export default async function MarketPage() {

    // Don't await the data fetching function
    const listingsResponse = getListings();

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <Suspense fallback={<MarketSuspense/>}>
                <ListingsContainer listingsResponse={listingsResponse} />
            </Suspense>
        </main>
    );
}
