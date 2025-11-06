"use server"

import {getListings} from "@/actions/listing-actions";
import MarketSection from "@/components/features/MarketSection";
import {Suspense} from "react";
import MarketSuspense from "@/components/suspense/MarketSuspense";
import {getCurrentUserRole} from "@/actions/user-actions";

export default async function MarketPage() {
    const listingsResponse = getListings();
    const userRole = getCurrentUserRole();

    return (
        <main className="px-20 py-12">
            <Suspense fallback={<MarketSuspense/>}>
                <MarketSection
                    listingsResponse={listingsResponse}
                    userRoleResponse={userRole}
                />
            </Suspense>
        </main>
    );
}
