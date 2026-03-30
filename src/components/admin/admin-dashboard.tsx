"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { $Enums } from "@prisma/client";
import { getAdminStats, getRecentlyListedItems, getFirstListingsAwaitingApproval, getAllUsers, approveFirstListing, rejectFirstListing, getSuspendedUsers, deleteListing } from "@/actions/admin-actions";
import { updateAdminUser, suspendUser, banUser, setUserActive } from "@/actions/user-actions";
import type { User, SuspendedUser } from "@/types/admin/users";
import type { RecentListing, PendingListing } from "@/types/admin/listings";

export default function Admin({ userRole }: { userRole: string | null }) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [suspensionModal, setSuspensionModal] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: '', userName: '' });
    const [suspensionDays, setSuspensionDays] = useState(7);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
    const [stats, setStats] = useState({ totalUsers: 0, activeListings: 0, pendingReports: 0, totalTransactions: 0, suspendedCount: 0 });
    const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
    const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSuspendedUsers, setShowSuspendedUsers] = useState(false);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [listingSearchQuery, setListingSearchQuery] = useState('');
    const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [selectedListing, setSelectedListing] = useState<RecentListing | null>(null);
    const [hasMoreListings, setHasMoreListings] = useState(false);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const [listingActionModal, setListingActionModal] = useState<{ open: boolean; listing: RecentListing | null }>({ open: false, listing: null });
    const [listingsPage, setListingsPage] = useState(1);
    const [usersPage, setUsersPage] = useState(1);
    const [pendingListingsPage, setPendingListingsPage] = useState(1);
    const [suspendedUsersPage, setSuspendedUsersPage] = useState(1);
    const [reportsPage, setReportsPage] = useState(1);
    const [totalListingsCount, setTotalListingsCount] = useState(0);
    const [totalUsersCount, setTotalUsersCount] = useState(0);
    const [totalPendingListingsCount, setTotalPendingListingsCount] = useState(0);
    const [totalSuspendedUsersCount, setTotalSuspendedUsersCount] = useState(0);
    const [totalReportsCount, setTotalReportsCount] = useState(0);
    const LISTINGS_PER_PAGE = 10;
    const USERS_PER_PAGE = 50;
    const PENDING_PER_PAGE = 10;
    const SUSPENDED_PER_PAGE = 20;
    const REPORTS_PER_PAGE = 50;
    const router = useRouter();

    useEffect(() => {
        if (userRole != "ADMIN") {
            router.push("/market");
            return;
        }

        // Fetch all data in parallel
        const fetchData = async () => {
            try {
                const [statsData, recentData, pendingData, usersData, suspendedData] = await Promise.all([
                    getAdminStats(),
                    getRecentlyListedItems(LISTINGS_PER_PAGE + 1, (listingsPage - 1) * LISTINGS_PER_PAGE),
                    getFirstListingsAwaitingApproval(PENDING_PER_PAGE + 1, (pendingListingsPage - 1) * PENDING_PER_PAGE),
                    getAllUsers(USERS_PER_PAGE + 1, (usersPage - 1) * USERS_PER_PAGE),
                    getSuspendedUsers(SUSPENDED_PER_PAGE + 1, (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE)
                ]);

                setStats({ ...statsData, suspendedCount: suspendedData.length });
                setRecentListings(recentData.slice(0, LISTINGS_PER_PAGE));
                setHasMoreListings(recentData.length > LISTINGS_PER_PAGE);
                setTotalListingsCount(statsData?.activeListings || 0);

                setPendingListings(pendingData.slice(0, PENDING_PER_PAGE));
                setTotalPendingListingsCount(pendingData.length > PENDING_PER_PAGE ? (pendingListingsPage * PENDING_PER_PAGE) + 1 : (pendingListingsPage - 1) * PENDING_PER_PAGE + pendingData.length);

                setUsers(usersData.slice(0, USERS_PER_PAGE));
                setHasMoreUsers(usersData.length > USERS_PER_PAGE);
                setTotalUsersCount(statsData?.totalUsers || 0);

                setSuspendedUsers(suspendedData.slice(0, SUSPENDED_PER_PAGE));
                setTotalSuspendedUsersCount(suspendedData.length > SUSPENDED_PER_PAGE ? (suspendedUsersPage * SUSPENDED_PER_PAGE) + 1 : (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE + suspendedData.length);
            } catch (error) {
                console.error("Error loading admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userRole, router, listingsPage, usersPage, pendingListingsPage, suspendedUsersPage]);

    function renderPagination(currentPage: number, totalItems: number, itemsPerPage: number, onPageChange: (page: number) => void) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages: (number | string)[] = [];
            const maxVisible = 5;

            if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);

                if (currentPage > 3) {
                    pages.push('...');
                }

                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);

                for (let i = start; i <= end; i++) {
                    pages.push(i);
                }

                if (currentPage < totalPages - 2) {
                    pages.push('...');
                }

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

                    {getPageNumbers().map((page, index) => (
                        typeof page === 'number' ? (
                            <button
                                key={index}
                                onClick={() => onPageChange(page)}
                                disabled={loading}
                                className={`px-3 py-1 border rounded-lg transition text-sm ${currentPage === page
                                    ? 'bg-green text-white border-green'
                                    : 'border-gray-300 hover:bg-gray-50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={index} className="px-2 text-gray-400">...</span>
                        )
                    ))}

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

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        if (selectedUser) {
            const { name, value } = e.target;
            setSelectedUser({ ...selectedUser, [name]: value });
        }
    }

    function handleSave() {
        if (!selectedUser) return;

        const saveUser = async () => {
            try {
                await updateAdminUser(selectedUser.id, {
                    name: selectedUser.name,
                    email: selectedUser.email,
                    role: selectedUser.role as $Enums.UserRole
                });
                setSelectedUser(null);
            } catch (error) {
                console.error("Error saving user:", error);
            }
        };

        saveUser();
    }

    async function handleApproveListing(listingId: string) {
        try {
            await approveFirstListing(listingId);
            setPendingListings(pendingListings.filter(l => l.id !== listingId));
        } catch (error) {
            console.error("Error approving listing:", error);
        }
    }

    async function handleRejectListing(listingId: string) {
        try {
            await rejectFirstListing(listingId);
            setPendingListings(pendingListings.filter(l => l.id !== listingId));
        } catch (error) {
            console.error("Error rejecting listing:", error);
        }
    }

    function handleViewListing(listingId: string) {
        router.push(`/market/listing/${listingId}`);
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const filteredListings = recentListings.filter(listing =>
        listing.title.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
        listing.sellerName.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
        listing.category.toLowerCase().includes(listingSearchQuery.toLowerCase())
    );

    async function handleSuspendUser() {
        if (!suspensionModal.userId || suspensionDays <= 0) {
            alert("Please enter valid suspension days");
            return;
        }

        setActionInProgress(true);
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + suspensionDays);

            await suspendUser(suspensionModal.userId, expiryDate);

            // Refresh suspended users list
            const updatedSuspendedUsers = await getSuspendedUsers(50);
            setSuspendedUsers(updatedSuspendedUsers);

            // Remove from active users list if present
            setUsers(users.filter(u => u.id !== suspensionModal.userId));
            setExpandedUserId(null);

            alert(`User ${suspensionModal.userName} suspended for ${suspensionDays} days`);
            setSuspensionModal({ open: false, userId: '', userName: '' });
            setSuspensionDays(7);
            setSuspensionReason('');
        } catch (error) {
            console.error("Error suspending user:", error);
            alert("Error suspending user");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleBanUser(userId: string, userName: string) {
        if (!confirm(`Are you sure you want to permanently ban ${userName}?`)) return;

        setActionInProgress(true);
        try {
            await banUser(userId);

            // Refresh suspended users list
            const updatedSuspendedUsers = await getSuspendedUsers(50);
            setSuspendedUsers(updatedSuspendedUsers);

            // Remove from active users list
            setUsers(users.filter(u => u.id !== userId));

            alert(`User ${userName} has been permanently banned`);
        } catch (error) {
            console.error("Error banning user:", error);
            alert("Error banning user");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleActivateUser(userId: string, userName: string) {
        if (!confirm(`Reactivate ${userName}?`)) return;

        setActionInProgress(true);
        try {
            await setUserActive(userId);

            // Remove from suspended users list
            setSuspendedUsers(suspendedUsers.filter(u => u.userId !== userId));

            alert(`User ${userName} has been reactivated`);
        } catch (error) {
            console.error("Error activating user:", error);
            alert("Error activating user");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleRemoveListing(listingId: string, listingTitle: string) {
        if (!confirm(`Are you sure you want to remove the listing "${listingTitle}"?`)) return;

        setActionInProgress(true);
        try {
            await deleteListing(listingId);
            setRecentListings(recentListings.filter(l => l.id !== listingId));
            setListingActionModal({ open: false, listing: null });
            alert(`Listing "${listingTitle}" has been removed`);
        } catch (error) {
            console.error("Error removing listing:", error);
            alert("Error removing listing");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleSuspendListingOwner(userId: string, userName: string) {
        setSuspensionModal({ open: true, userId, userName });
        setListingActionModal({ open: false, listing: null });
    }

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Overview of marketplace activity and management tools</p>
                </div>
                <button
                    onClick={() => router.push("/market")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-2 whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0-3.675V5.007c0-.694-.506-1.285-1.175-1.402C15.198 3.4 13.653 3 12 3s-3.197.4-4.825.605c-.669.117-1.175.708-1.175 1.402v12.694m0 0H1.36" />
                    </svg>
                    Back to Marketplace
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-6">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Total Users</div>
                    <div className="text-3xl font-black text-green">{loading ? "-" : stats.totalUsers.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">Registered on platform</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Active Listings</div>
                    <div className="text-3xl font-black text-green">{loading ? "-" : stats.activeListings}</div>
                    <div className="text-xs text-gray-400 mt-1">Currently available</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Pending Approvals</div>
                    <div className="text-3xl font-black text-orange-500">{loading ? "-" : pendingListings.length}</div>
                    <div className="text-xs text-gray-400 mt-1">First listings to review</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Pending Reports</div>
                    <div className="text-3xl font-black text-red-500">{loading ? "-" : stats.pendingReports}</div>
                    <div className="text-xs text-gray-400 mt-1">Reported listings</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition" onClick={() => setShowSuspendedUsers(!showSuspendedUsers)}>
                    <div className="text-gray-500 text-sm font-semibold mb-2">Suspended Users</div>
                    <div className="text-3xl font-black text-orange-600">{loading ? "-" : stats.suspendedCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Suspended or banned</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-3 gap-6">
                    <Link href="/admin/users" className="bg-orange-500 rounded-3xl h-[200px] flex items-center justify-center text-white hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <div className="text-xl font-bold">Users</div>
                        </div>
                    </Link>

                    <Link href="/admin/listings" className="bg-green rounded-3xl h-[200px] flex items-center justify-center text-white hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <div className="text-xl font-bold">Listings</div>
                        </div>
                    </Link>

                    <Link href="/admin/reports" className="bg-green rounded-3xl h-[200px] flex items-center justify-center text-white hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            <div className="text-xl font-bold">Handle Reports</div>
                        </div>
                    </Link>
                </div>
            </div>
        </main >
    );
}
