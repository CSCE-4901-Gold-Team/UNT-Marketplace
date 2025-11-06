"use client"

import {ListingObject} from "@/models/ListingObject";
import {use, useState} from "react";
import ListingsContainer from "@/components/ui/ListingsContainer";
import TextInput from "@/components/ui/TextInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {getListings} from "@/actions/listing-actions";
import Button from "@/components/ui/Button";
import {FaMagnifyingGlass} from "react-icons/fa6";
import MarketFilterControls from "@/components/ui/MarketFilterControls";
import {ListingFilters} from "@/types/ListingFilters";
import {$Enums} from "@/generated/prisma";
import UserRole = $Enums.UserRole;

export default function MarketSection({
    listingsResponse,
    userRoleResponse
}: {
    listingsResponse: Promise<ListingObject[]>;
    userRoleResponse: Promise<UserRole>;
}) {
    const [listings, setListings] = useState(use(listingsResponse)); // Listing object
    const userRole = use(userRoleResponse);
    const [searchQuery, setSearchQuery] = useState(""); // Search input state
    const [listingsLoading, setListingsLoading] = useState(false); // Listing loading state
    const [filterObject, setFilterObject] = useState<ListingFilters>({
        priceMin: "",
        priceMax: ""
    });

    async function searchListings() {
        if (listingsLoading) return;

        setListingsLoading(true);
        setListings(await getListings(searchQuery, filterObject));
        setListingsLoading(false);
    }

    return (
        <div id="marketSectionWrapper" className="flex flex-col gap-6">

            <div className="market-controls flex justify-between items-center">
                <div className="market-search-container">
                    <div className="flex">
                        <TextInput inputClasses="rounded-r-none border-r-0"
                                   onChange={e => setSearchQuery(e.target.value)}
                                   onKeyDown={e => { if (e.key === "Enter") { void searchListings() } }}
                                   placeholder="Search..."
                        />
                        <Button buttonStyle="icon" buttonClasses="rounded-l-none" onClick={searchListings}><FaMagnifyingGlass /></Button>
                    </div>
                </div>

                <div className="market-filter-container">
                    <MarketFilterControls
                        filterObject={filterObject}
                        setFilterObjectAction={setFilterObject}
                        refreshListingsAction={searchListings}
                        userRole={userRole}
                    />
                </div>
            </div>

            {

                listingsLoading ? <LoadingSpinner /> :
                    (listings.length === 0 ? <h2 className="text-gray-400 text-center mt-16">No listings found</h2> :
                        <ListingsContainer listings={listings} />)
            }

        </div>
    );
}
