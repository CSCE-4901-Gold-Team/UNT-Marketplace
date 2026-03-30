"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecentListing, PendingListing } from "@/types/admin/listings";
import { getAdminStats, getRecentlyListedItems, getFirstListingsAwaitingApproval, approveFirstListing, rejectFirstListing, deleteListing } from "@/actions/admin-actions";

export default function AdminListings({ userRole }: { userRole: string | null }) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);

    const LISTINGS_PER_PAGE = 10;
    const PENDING_PER_PAGE = 10;

    const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
    const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
    const [listingSearchQuery, setListingSearchQuery] = useState("");
    const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
    const [listingActionModal, setListingActionModal] = useState<{ open: boolean; listing: RecentListing | null }>({ open: false, listing: null });

    const [listingsPage, setListingsPage] = useState(1);
    const [pendingListingsPage, setPendingListingsPage] = useState(1);

    const [totalListingsCount, setTotalListingsCount] = useState(0);
    const [totalPendingListingsCount, setTotalPendingListingsCount] = useState(0);

    useEffect(() => {
        if (userRole !== "ADMIN") {
            router.push("/market");
            return;
        }

        const load = async () => {
            try {
                const [statsData, recentData, pendingData] = await Promise.all([
                    getAdminStats(),
                    getRecentlyListedItems(LISTINGS_PER_PAGE + 1, (listingsPage - 1) * LISTINGS_PER_PAGE),
                    getFirstListingsAwaitingApproval(PENDING_PER_PAGE + 1, (pendingListingsPage - 1) * PENDING_PER_PAGE),
                ]);

                setRecentListings(recentData.slice(0, LISTINGS_PER_PAGE));
                setTotalListingsCount(statsData?.activeListings || 0);

                setPendingListings(pendingData.slice(0, PENDING_PER_PAGE));
                setTotalPendingListingsCount(
                    pendingData.length > PENDING_PER_PAGE
                        ? (pendingListingsPage * PENDING_PER_PAGE) + 1
                        : (pendingListingsPage - 1) * PENDING_PER_PAGE + pendingData.length
                );
            } catch (e) {
                console.error("Error loading listings:", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userRole, router, listingsPage, pendingListingsPage]);

    function renderPagination(currentPage: number, totalItems: number, itemsPerPage: number, onPageChange: (page: number) => void) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages: (number | string)[] = [];
            const maxVisible = 5;

            if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                if (currentPage > 3) pages.push("...");
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (currentPage < totalPages - 2) pages.push("...");
                pages.push(totalPages);
            }

            return pages;
        };

        return (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                <div className="text-sm text-gray-600">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                        Previous
                    </button>
                    {getPageNumbers().map((page, index) =>
                        typeof page === "number" ? (
                            <button
                                key={index}
                                onClick={() => onPageChange(page)}
                                disabled={loading}
                                className={`px-3 py-1 border rounded-lg transition text-sm ${
                                    currentPage === page ? "bg-green text-white border-green" : "border-gray-300 hover:bg-gray-50"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={index} className="px-2 text-gray-400">
                                ...
                            </span>
                        )
                    )}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    }

    function handleViewListing(listingId: string) {
        router.push(`/market/listing/${listingId}`);
    }

    async function handleApproveListing(listingId: string) {
        try {
            await approveFirstListing(listingId);
            setPendingListings((prev) => prev.filter((l) => l.id !== listingId));
        } catch (e) {
            console.error("Error approving listing:", e);
        }
    }

    async function handleRejectListing(listingId: string) {
        try {
            await rejectFirstListing(listingId);
            setPendingListings((prev) => prev.filter((l) => l.id !== listingId));
        } catch (e) {
            console.error("Error rejecting listing:", e);
        }
    }

    async function handleRemoveListing(listingId: string, listingTitle: string) {
        if (!confirm(`Are you sure you want to remove the listing "${listingTitle}"?`)) return;
        try {
            await deleteListing(listingId);
            setRecentListings((prev) => prev.filter((l) => l.id !== listingId));
            setListingActionModal({ open: false, listing: null });
            alert(`Listing "${listingTitle}" has been removed`);
        } catch (e) {
            console.error("Error removing listing:", e);
            alert("Error removing listing");
        }
    }

    function handleSuspendListingOwner(userId: string) {
        // Redirect to Users page with query param (optional hook-up on Users page)
        router.push(`/admin/users?userId=${encodeURIComponent(userId)}`);
        setListingActionModal({ open: false, listing: null });
    }

    const filteredListings = recentListings.filter((listing) =>
        listing.title.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
        listing.sellerName.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
        listing.category.toLowerCase().includes(listingSearchQuery.toLowerCase())
    );

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold">Manage Listings</h1>
                    <p className="text-gray-600 mt-2">Review and manage marketplace listings and reports</p>
                </div>
                <button
                    onClick={() => router.push("/admin")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Recently Listed Items */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Recently Listed Items</h2>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by title, seller, or category..."
                            value={listingSearchQuery}
                            onChange={(e) => setListingSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green"
                        />
                    </div>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="text-gray-500 text-center py-8">Loading...</div>
                        ) : filteredListings.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                {listingSearchQuery ? "No listings match your search" : "No recent listings"}
                            </div>
                        ) : (
                            filteredListings.map((listing, index) => (
                                <div key={listing.id}>
                                    <div
                                        onClick={() => setExpandedListingId(expandedListingId === listing.id ? null : listing.id)}
                                        className={`flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-gray-50 rounded-lg transition ${
                                            index !== filteredListings.length - 1 ? "border-b border-gray-100" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-green">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold">{listing.title}</div>
                                                <div className="text-sm text-gray-500">
                                                    {listing.price} · {listing.category}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    by {listing.sellerName} ({listing.seller})
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm text-gray-400">{listing.date}</div>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className={`size-5 transition-transform ${expandedListingId === listing.id ? "rotate-180" : ""}`}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </div>
                                    </div>
                                    {expandedListingId === listing.id && (
                                        <div className="bg-gray-50 px-4 py-3 rounded-lg mt-2 flex gap-2">
                                            <button
                                                onClick={() => handleViewListing(listing.id)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                                            >
                                                View Listing
                                            </button>
                                            <button
                                                onClick={() => setListingActionModal({ open: true, listing })}
                                                className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
                                            >
                                                Admin Actions
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    {renderPagination(listingsPage, totalListingsCount, LISTINGS_PER_PAGE, setListingsPage)}
                </div>
            </div>

            {/* First Listings Awaiting Approval */}
            <div>
                <h2 className="text-2xl font-bold mb-4">First Listings Awaiting Approval</h2>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="grid grid-cols-6 font-semibold text-gray-700 mb-3">
                        <div>Listing Title</div>
                        <div>Seller</div>
                        <div>Category</div>
                        <div>Price</div>
                        <div>Date Submitted</div>
                        <div>Action</div>
                    </div>
                    <div className="h-px my-3 bg-gray-200" />
                    {loading ? (
                        <div className="text-gray-500 text-center py-8">Loading...</div>
                    ) : pendingListings.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">No pending listings</div>
                    ) : (
                        pendingListings.map((listing) => (
                            <div key={listing.id} className="grid grid-cols-6 py-3 items-center hover:bg-green-50 rounded-xl px-2 transition">
                                <div className="truncate" title={listing.title}>
                                    {listing.title}
                                </div>
                                <div className="truncate text-sm" title={listing.seller}>
                                    {listing.seller}
                                </div>
                                <div>{listing.category}</div>
                                <div>{listing.price}</div>
                                <div>{listing.date}</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApproveListing(listing.id)}
                                        className="px-3 py-1 bg-green text-white rounded-xl text-sm hover:opacity-90 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRejectListing(listing.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded-xl text-sm hover:opacity-90 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                    {renderPagination(pendingListingsPage, totalPendingListingsCount, PENDING_PER_PAGE, setPendingListingsPage)}
                </div>
            </div>

            {/* Listing Action Modal */}
            {listingActionModal.open && listingActionModal.listing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-[500px] p-6 shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 text-center">Admin Actions - Listing</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <div className="font-semibold text-blue-900">{listingActionModal.listing.title}</div>
                            <div className="text-sm text-blue-800 mt-1">by {listingActionModal.listing.sellerName}</div>
                            <div className="text-sm text-blue-700 mt-1">Price: {listingActionModal.listing.price}</div>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div
                                className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => handleSuspendListingOwner(listingActionModal.listing!.seller)}
                            >
                                <div className="font-semibold text-orange-600">Suspend Seller</div>
                                <div className="text-sm text-gray-600 mt-1">Open user page to suspend this account</div>
                            </div>
                            <div
                                className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => handleRemoveListing(listingActionModal.listing!.id, listingActionModal.listing!.title)}
                            >
                                <div className="font-semibold text-red-600">Remove Listing</div>
                                <div className="text-sm text-gray-600 mt-1">Delete this listing from the marketplace</div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setListingActionModal({ open: false, listing: null })}
                                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions for Listings */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div
                        onClick={() => router.push("/admin/reports")}
                        className="bg-green rounded-3xl h-[200px] flex items-center justify-center text-white cursor-pointer hover:shadow-xl transition-shadow"
                    >
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            <div className="text-xl font-bold">Handle Reports</div>
                        </div>
                    </div>
                    <div className="bg-green rounded-3xl h-[200px] flex items-center justify-center text-white cursor-pointer hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <div className="text-xl font-bold">Generate Report</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
