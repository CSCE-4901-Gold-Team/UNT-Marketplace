"use client"

import { ListingObject } from "@/models/ListingObject";
import {use, useEffect, useRef, useState} from "react";
import ListingsContainer from "@/components/ui/ListingsContainer";
import TextInput from "@/components/ui/TextInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getListings } from "@/actions/listing-actions";
import Button from "@/components/ui/Button";
import { FaMagnifyingGlass } from "react-icons/fa6";
import MarketFilterControls from "@/components/ui/MarketFilterControls";
import { ListingFilters } from "@/types/ListingFilters";
import { $Enums } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import CategoryList from "@/components/ui/CategoryList";

import UserRole = $Enums.UserRole;
import Link from "next/link";
import {fireListingEvents} from "@/actions/analytics-actions";

export default function MarketSection({
    listingsResponse,
    userRoleResponse
}: {
    listingsResponse: Promise<ListingObject[]>;
    userRoleResponse: Promise<UserRole>;
}) {
    const [listings, setListings] = useState(use(listingsResponse)); // Listing object
    const userRole = use(userRoleResponse);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(""); // Search input state
    const [listingsLoading, setListingsLoading] = useState(false); // Listing loading state
    const [newPageLoading, setNewPageLoading] = useState(false);
    const [allListingsLoaded, setAllListingsLoaded] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("category"));
    const [filterObject, setFilterObject] = useState<ListingFilters>({
        priceMin: "",
        priceMax: ""
    });

    // Scroll observer
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const impressedListingIdsRef = useRef<Set<string>>(new Set());

    // Pagination variables
    const [pageSize] = useState<number>(12);
    const [skipIndex, setSkipIndex] = useState<number>(pageSize);

    // Set up scroll observer
    useEffect(() => {
        if (!sentinelRef.current) return;

        // Set observer on viewport, watch sentinel element
        observerRef.current = new IntersectionObserver(
            async ([entry]) => {
                if (entry.isIntersecting && !listingsLoading) {
                    await loadNextListingsPage();
                }
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0,
            }
        );
        observerRef.current.observe(sentinelRef.current);

        // Handles loading the next page of listings
        async function loadNextListingsPage() {
            if (listingsLoading || newPageLoading || allListingsLoaded) return;

            // Set state variables
            setNewPageLoading(true);
            setSkipIndex(skipIndex + pageSize);

            // Get new listings
            const newListings = await getListings(searchQuery, filterObject, skipIndex, pageSize);

            // If less than take amount returned we're out of listings
            if (newListings.length < pageSize) {
                setAllListingsLoaded(true);
            }

            // Add new listings on top of old listings
            setListings([
                ...listings,
                ...newListings
            ]);

            setNewPageLoading(false);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [allListingsLoaded, filterObject, listings, listingsLoading, newPageLoading, pageSize, searchQuery, skipIndex]);

    // Trigger search when category filter changes
    useEffect(() => {
        void searchListings();
    }, [filterObject.categories]);

    async function searchListings() {
        if (listingsLoading || newPageLoading) return;

        setListingsLoading(true);
        setSkipIndex(pageSize);
        setAllListingsLoaded(false);

        // New result set => reset local tracking
        impressedListingIdsRef.current = new Set();

        setListings(await getListings(searchQuery, filterObject, 0, pageSize));
        setListingsLoading(false);
    }

    return (
        <div id="marketSectionWrapper" className="flex flex-col gap-4 sm:gap-6">
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6">
                    Listings
                </h1>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                        <h2 className="text-lg sm:text-xl lg:text-2xl">
                            Category
                        </h2>
                        <CategoryList 
                            selectedCategory={selectedCategory}
                            onCategorySelect={(category) => {
                                setSelectedCategory(category);
                                setFilterObject(prev => ({ ...prev, categories: category ? [category] : undefined }));
                            }}
                        />
                    </div>
                    <div className="market-filter-container w-full lg:w-auto">
                        <MarketFilterControls
                            filterObject={filterObject}
                            setFilterObjectAction={setFilterObject}
                            refreshListingsAction={searchListings}
                            userRole={userRole}
                        />
                    </div>
                </div>
            </div>

            <div className="market-controls flex gap-0 justify-start items-center">
                <div className="market-search-container w-full sm:w-auto">
                    <div className="flex">
                        <TextInput inputClasses="rounded-r-none border-r-0"
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { void searchListings() } }}
                            placeholder="Search..."
                        />
                        <Button buttonStyle="icon" buttonClasses="rounded-l-none" onClick={searchListings}><FaMagnifyingGlass /></Button>
                    </div>
                </div>

                <div className="market-filter-container flex gap-4 items-center">
                    {userRole === "ADMIN" && (
                        <Link href="/admin">
                            <Button buttonStyle="bg" title="Admin Panel">
                                Admin Panel
                            </Button>
                        </Link>
                    )}
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
                    (listings.length === 0 ? <h2 className="text-gray-400 text-center mt-8 sm:mt-16 text-base sm:text-xl">No listings found</h2> :
                        <ListingsContainer listings={listings} />)
            }

            {
                !allListingsLoaded && !listingsLoading &&
                    <div ref={sentinelRef} className="text-center pt-8 sm:pt-12 pb-4 sm:pb-6">
                        <LoadingSpinner />
                    </div>
            }
            {
                allListingsLoaded && (
                    <h2 className="text-gray-300 text-center mt-8 sm:mt-16 text-base sm:text-xl">that&#39;s all folks</h2>
                )
            }

        </div>
    );
}
