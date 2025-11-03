"use client"

import {ListingReturnType} from "@/models/ListingReturnType";
import {use, useState} from "react";
import ListingsContainer from "@/components/features/ListingsContainer";
import TextInput from "@/components/ui/TextInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {getListings} from "@/actions/listing-actions";
import Button from "@/components/ui/Button";
import {FaMagnifyingGlass} from "react-icons/fa6";

export default function MarketSection({
    listingsResponse
}: {
    listingsResponse: Promise<ListingReturnType[]>;
}) {
    const [listings, setListings] = useState(use(listingsResponse));
    const [searchQuery, setSearchQuery] = useState("");
    const [listingsLoading, setListingsLoading] = useState(false);

    async function searchListings() {
        if (listingsLoading) return;

        setListingsLoading(true);
        setListings(await getListings(searchQuery));
        setListingsLoading(false);
    }

    return (
        <div id="marketSectionWrapper" className="flex flex-col gap-6">

            <div className="market-search-container">

                <div className="flex">
                    <TextInput inputClasses="rounded-r-none border-r-0"
                               onChange={e => setSearchQuery(e.target.value)}
                               onKeyDown={e => { if (e.key === "Enter") { void searchListings() } }}
                               placeholder="Search..."
                    />
                    <Button buttonClasses="rounded-l-none" onClick={searchListings}><FaMagnifyingGlass /></Button>
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
