"use server"

import {getListings} from "@/actions/listing-actions";
import MarketSection from "@/components/features/MarketSection";
import {Suspense} from "react";
import MarketSuspense from "@/components/suspense/MarketSuspense";
import {getCurrentUserRole} from "@/actions/user-actions";
import ListingSuccessToast from "@/components/ui/ListingSuccessToast";
import {ListingFilters} from "@/types/ListingFilters";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function MarketPage({
    searchParams,
}: {
    searchParams: Promise<{ mine?: string }>;
}) {
    const params = await searchParams;
    const isMyListingsView = params.mine === "1";
    const initialFilters: ListingFilters = {
        mine: isMyListingsView,
    };

    const listingsResponse = getListings("", initialFilters, 0, 12);
    const userRole = getCurrentUserRole();
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const currentUserId = session?.user?.id ?? "";

    return (
        <main className="px-8 py-4 lg:px-20 lg:py-12">
            <Suspense fallback={null}>
                <ListingSuccessToast />
            </Suspense>
            <Suspense fallback={<MarketSuspense/>}>
                <MarketSection
                    key={isMyListingsView ? "market-mine" : "market-all"}
                    listingsResponse={listingsResponse}
                    userRoleResponse={userRole}
                    currentUserId={currentUserId}
                    initialFilters={initialFilters}
                />
            </Suspense>
        </main>
    );
}
