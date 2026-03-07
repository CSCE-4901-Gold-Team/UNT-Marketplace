import {getListings} from "@/actions/listing-actions";
import MarketSection from "@/components/features/MarketSection";
import {Suspense} from "react";
import MarketSuspense from "@/components/suspense/MarketSuspense";
import {getCurrentUserRole} from "@/actions/user-actions";
import ListingSuccessToast from "@/components/ui/ListingSuccessToast";
import {ListingFilters} from "@/types/ListingFilters";

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

    return (
        <main className="px-3 py-3 sm:px-4 sm:py-4 lg:px-8 lg:py-8 w-full">
            <Suspense fallback={<MarketSuspense/>}>
                <MarketSection
                    key={isMyListingsView ? "market-mine" : "market-all"}
                    listingsResponse={listingsResponse}
                    userRoleResponse={userRole}
                    initialFilters={initialFilters}
                />
            </Suspense>
        </main>
    );
}
