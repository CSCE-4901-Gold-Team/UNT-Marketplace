import {getListings} from "@/actions/listing-actions";
import MarketSection from "@/components/features/MarketSection";
import {Suspense} from "react";
import MarketSuspense from "@/components/suspense/MarketSuspense";
import {getCurrentUserRole} from "@/actions/user-actions";

export default async function MarketPage() {
    const listingsResponse = getListings("", {}, 0, 12);
    const userRole = getCurrentUserRole();

    return (
        <main className="px-3 py-3 sm:px-4 sm:py-4 lg:px-8 lg:py-8 w-full">
            <Suspense fallback={<MarketSuspense/>}>
                <MarketSection
                    listingsResponse={listingsResponse}
                    userRoleResponse={userRole}
                />
            </Suspense>
        </main>
    );
}
