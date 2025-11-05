import { getListings } from "@/actions/listing-actions";
import { getCurrentUserRole } from "@/actions/user-actions";
import MarketSection from "@/components/features/MarketSection";

export default async function Market() {
    const listingsResponse = getListings();
    const userRole = getCurrentUserRole();

    return (
        <main className="px-20 py-12">
            <MarketSection listingsResponse={listingsResponse} userRoleResponse={userRole} />
        </main>
    );
}
