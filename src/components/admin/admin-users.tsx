"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { $Enums } from "@/prisma/generated";
import type { User, SuspendedUser } from "@/types/admin/users";
import {
    getAdminStats,
    getAllUsers,
    getSuspendedUsers,
    getPendingProfanityFlags,
    reviewProfanityFlag,
    getPendingListingProfanityFlags,
    type ListingProfanityQueueSort,
    reviewListingProfanityFlag,
    type ProfanityFlagRow,
    type ListingProfanityFlagRow,
} from "@/actions/admin-actions";
import { updateAdminUser, suspendUser, banUser, setUserActive } from "@/actions/user-actions";
import Pagination from "../ui/Pagination";

export default function AdminUsers({ userRole }: { userRole: string | null }) {
    const router = useRouter();

    const USERS_PER_PAGE = 50;
    const SUSPENDED_PER_PAGE = 20;
    const PROFANITY_PER_PAGE = 10;
    const LISTING_PROFANITY_PER_PAGE = 10;

    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(false);

    const [users, setUsers] = useState<User[]>([]);
    const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);

    const [usersPage, setUsersPage] = useState(1);
    const [suspendedUsersPage, setSuspendedUsersPage] = useState(1);

    const [totalUsersCount, setTotalUsersCount] = useState(0);
    const [totalSuspendedUsersCount, setTotalSuspendedUsersCount] = useState(0);

    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [suspensionModal, setSuspensionModal] = useState<{ open: boolean; userId: string; userName: string }>({
        open: false,
        userId: "",
        userName: "",
    });
    const [suspensionDays, setSuspensionDays] = useState(7);
    const [suspensionReason, setSuspensionReason] = useState("");
    const [showSuspendedUsers, setShowSuspendedUsers] = useState(false);

    const [profanityFlags, setProfanityFlags] = useState<ProfanityFlagRow[]>([]);
    const [profanityPage, setProfanityPage] = useState(1);
    const [profanityTotalCount, setProfanityTotalCount] = useState(0);
    const [profanityFlagIdForAction, setProfanityFlagIdForAction] = useState<string | null>(null);
    const [listingProfanityFlags, setListingProfanityFlags] = useState<ListingProfanityFlagRow[]>([]);
    const [listingProfanityPage, setListingProfanityPage] = useState(1);
    const [listingProfanityTotalCount, setListingProfanityTotalCount] = useState(0);
    const [listingProfanityFlagIdForAction, setListingProfanityFlagIdForAction] = useState<string | null>(null);
    const [listingProfanitySort, setListingProfanitySort] = useState<ListingProfanityQueueSort>("newest");
    const [queueStats, setQueueStats] = useState({
        pendingProfanityFlags: 0,
        pendingListingProfanityFlags: 0,
    });

    useEffect(() => {
        if (userRole !== "ADMIN") {
            router.push("/market");
            return;
        }

        const load = async () => {
            try {
                const [
                    statsData,
                    usersData,
                    suspendedData,
                    profanityQueue,
                    listingProfanityQueue,
                ] = await Promise.all([
                    getAdminStats(),
                    getAllUsers(USERS_PER_PAGE + 1, (usersPage - 1) * USERS_PER_PAGE),
                    getSuspendedUsers(SUSPENDED_PER_PAGE + 1, (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE),
                    getPendingProfanityFlags(PROFANITY_PER_PAGE, (profanityPage - 1) * PROFANITY_PER_PAGE),
                    getPendingListingProfanityFlags(
                        LISTING_PROFANITY_PER_PAGE,
                        (listingProfanityPage - 1) * LISTING_PROFANITY_PER_PAGE,
                        listingProfanitySort
                    ),
                ]);

                setUsers(usersData.slice(0, USERS_PER_PAGE));
                setTotalUsersCount(statsData?.totalUsers || 0);

                setSuspendedUsers(suspendedData.slice(0, SUSPENDED_PER_PAGE));
                setTotalSuspendedUsersCount(
                    suspendedData.length > SUSPENDED_PER_PAGE
                        ? suspendedUsersPage * SUSPENDED_PER_PAGE + 1
                        : (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE + suspendedData.length
                );

                setQueueStats({
                    pendingProfanityFlags: statsData.pendingProfanityFlags ?? 0,
                    pendingListingProfanityFlags: statsData.pendingListingProfanityFlags ?? 0,
                });
                setProfanityFlags(profanityQueue.flags);
                setProfanityTotalCount(profanityQueue.total);
                setListingProfanityFlags(listingProfanityQueue.flags);
                setListingProfanityTotalCount(listingProfanityQueue.total);
            } catch (e) {
                console.error("Error loading users:", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userRole, router, usersPage, suspendedUsersPage, profanityPage, listingProfanityPage, listingProfanitySort]);

    useEffect(() => {
        setListingProfanityPage(1);
    }, [listingProfanitySort]);

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
                    role: selectedUser.role as $Enums.UserRole,
                });
                setSelectedUser(null);
            } catch (error) {
                console.error("Error saving user:", error);
            }
        };

        saveUser();
    }

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

            if (profanityFlagIdForAction) {
                await reviewProfanityFlag(profanityFlagIdForAction, "ACTIONED");
                setProfanityFlagIdForAction(null);
            }
            if (listingProfanityFlagIdForAction) {
                await reviewListingProfanityFlag(listingProfanityFlagIdForAction, "ACTIONED");
                setListingProfanityFlagIdForAction(null);
            }

            const suspendedName = suspensionModal.userName;
            const daysSuspended = suspensionDays;

            const updated = await getSuspendedUsers(SUSPENDED_PER_PAGE + 1, (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE);
            setSuspendedUsers(updated.slice(0, SUSPENDED_PER_PAGE));
            setUsers((prev) => prev.filter((u) => u.id !== suspensionModal.userId));
            setExpandedUserId(null);

            const [statsData, pq, lq] = await Promise.all([
                getAdminStats(),
                getPendingProfanityFlags(PROFANITY_PER_PAGE, (profanityPage - 1) * PROFANITY_PER_PAGE),
                getPendingListingProfanityFlags(
                    LISTING_PROFANITY_PER_PAGE,
                    (listingProfanityPage - 1) * LISTING_PROFANITY_PER_PAGE,
                    listingProfanitySort
                ),
            ]);
            setQueueStats({
                pendingProfanityFlags: statsData.pendingProfanityFlags ?? 0,
                pendingListingProfanityFlags: statsData.pendingListingProfanityFlags ?? 0,
            });
            setProfanityFlags(pq.flags);
            setProfanityTotalCount(pq.total);
            setListingProfanityFlags(lq.flags);
            setListingProfanityTotalCount(lq.total);

            alert(`User ${suspendedName} suspended for ${daysSuspended} days`);
            setSuspensionModal({ open: false, userId: "", userName: "" });
            setSuspensionDays(7);
            setSuspensionReason("");
        } catch (error) {
            console.error("Error suspending user:", error);
            alert("Error suspending user");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleBanUser(
        userId: string,
        userName: string,
        opts?: { messageProfanityFlagId?: string; listingProfanityFlagId?: string }
    ) {
        if (!confirm(`Are you sure you want to permanently ban ${userName}?`)) return;

        setActionInProgress(true);
        try {
            await banUser(userId);

            if (opts?.messageProfanityFlagId) {
                await reviewProfanityFlag(opts.messageProfanityFlagId, "ACTIONED");
            }
            if (opts?.listingProfanityFlagId) {
                await reviewListingProfanityFlag(opts.listingProfanityFlagId, "ACTIONED");
            }

            const updated = await getSuspendedUsers(SUSPENDED_PER_PAGE + 1, (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE);
            setSuspendedUsers(updated.slice(0, SUSPENDED_PER_PAGE));
            setUsers((prev) => prev.filter((u) => u.id !== userId));

            const [statsData, pq, lq] = await Promise.all([
                getAdminStats(),
                getPendingProfanityFlags(PROFANITY_PER_PAGE, (profanityPage - 1) * PROFANITY_PER_PAGE),
                getPendingListingProfanityFlags(
                    LISTING_PROFANITY_PER_PAGE,
                    (listingProfanityPage - 1) * LISTING_PROFANITY_PER_PAGE,
                    listingProfanitySort
                ),
            ]);
            setQueueStats({
                pendingProfanityFlags: statsData.pendingProfanityFlags ?? 0,
                pendingListingProfanityFlags: statsData.pendingListingProfanityFlags ?? 0,
            });
            setProfanityFlags(pq.flags);
            setProfanityTotalCount(pq.total);
            setListingProfanityFlags(lq.flags);
            setListingProfanityTotalCount(lq.total);

            alert(`User ${userName} has been permanently banned`);
        } catch (error) {
            console.error("Error banning user:", error);
            alert("Error banning user");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleDismissProfanity(flagId: string) {
        setActionInProgress(true);
        try {
            await reviewProfanityFlag(flagId, "REVIEWED_NO_ACTION");
            const [statsData, pq] = await Promise.all([
                getAdminStats(),
                getPendingProfanityFlags(PROFANITY_PER_PAGE, (profanityPage - 1) * PROFANITY_PER_PAGE),
            ]);
            setQueueStats({
                pendingProfanityFlags: statsData.pendingProfanityFlags ?? 0,
                pendingListingProfanityFlags: statsData.pendingListingProfanityFlags ?? 0,
            });
            setProfanityFlags(pq.flags);
            setProfanityTotalCount(pq.total);
        } catch (error) {
            console.error("Error dismissing profanity flag:", error);
            alert("Could not update review status");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleDismissListingProfanity(flagId: string) {
        setActionInProgress(true);
        try {
            await reviewListingProfanityFlag(flagId, "REVIEWED_NO_ACTION");
            const [statsData, lq] = await Promise.all([
                getAdminStats(),
                getPendingListingProfanityFlags(
                    LISTING_PROFANITY_PER_PAGE,
                    (listingProfanityPage - 1) * LISTING_PROFANITY_PER_PAGE,
                    listingProfanitySort
                ),
            ]);
            setQueueStats({
                pendingProfanityFlags: statsData.pendingProfanityFlags ?? 0,
                pendingListingProfanityFlags: statsData.pendingListingProfanityFlags ?? 0,
            });
            setListingProfanityFlags(lq.flags);
            setListingProfanityTotalCount(lq.total);
        } catch (error) {
            console.error("Error dismissing listing profanity flag:", error);
            alert("Could not update review status");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleActivateUser(userId: string, userName: string) {
        if (!confirm(`Reactivate ${userName}?`)) return;

        setActionInProgress(true);
        try {
            await setUserActive(userId);
            setSuspendedUsers((prev) => prev.filter((u) => u.userId !== userId));
            alert(`User ${userName} has been reactivated`);
        } catch (error) {
            console.error("Error activating user:", error);
            alert("Error activating user");
        } finally {
            setActionInProgress(false);
        }
    }

    const filteredUsers = users.filter(
        (user) => user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold">User Management</h1>
                    <p className="text-gray-600 mt-2">Search, edit, suspend, and ban users</p>
                </div>
                <button
                    onClick={() => router.push("/admin")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-amber-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">DM profanity queue</div>
                    <div className="text-3xl font-black text-amber-700">{loading ? "-" : queueStats.pendingProfanityFlags}</div>
                    <div className="text-xs text-gray-400 mt-1">Messages to review</div>
                </div>
                <div className="bg-white border-2 border-amber-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Listing profanity queue</div>
                    <div className="text-3xl font-black text-amber-700">{loading ? "-" : queueStats.pendingListingProfanityFlags}</div>
                    <div className="text-xs text-gray-400 mt-1">Listings to review</div>
                </div>
            </div>

            {/* Quick Actions - Manage Suspensions */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div
                        onClick={() => setShowSuspendedUsers((prev) => !prev)}
                        className="bg-orange-500 rounded-3xl h-[200px] flex items-center justify-center text-white cursor-pointer hover:shadow-xl transition-shadow"
                    >
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <div className="text-xl font-bold">Manage Suspensions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direct message profanity review */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Direct message moderation</h2>
                <p className="text-gray-600 text-sm mb-4 max-w-3xl">
                    When a user sends a message that matches the profanity filter, the original text is stored here for review.
                    Dismiss if no action is needed, or suspend or ban the sender if the violation warrants it.
                </p>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    {loading ? (
                        <div className="text-gray-500 text-center py-8">Loading...</div>
                    ) : profanityFlags.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">No pending profanity reviews</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto space-y-6">
                                {profanityFlags.map((flag) => (
                                    <div key={flag.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/80">
                                        <div className="flex flex-wrap gap-4 justify-between items-start mb-3">
                                            <div>
                                                <div className="text-sm text-gray-500">{new Date(flag.createdAt).toLocaleString()}</div>
                                                <div className="font-semibold text-gray-900 mt-1">
                                                    {flag.senderName}{" "}
                                                    <span className="font-normal text-gray-600">({flag.senderEmail})</span>
                                                </div>
                                                {flag.listingTitle && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        Conversation re:{" "}
                                                        {flag.listingId ? (
                                                            <Link
                                                                href={`/market/listing/${flag.listingId}`}
                                                                className="text-green hover:underline"
                                                            >
                                                                {flag.listingTitle}
                                                            </Link>
                                                        ) : (
                                                            flag.listingTitle
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDismissProfanity(flag.id)}
                                                    disabled={actionInProgress}
                                                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition disabled:opacity-50"
                                                >
                                                    Dismiss (no action)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProfanityFlagIdForAction(flag.id);
                                                        setListingProfanityFlagIdForAction(null);
                                                        setSuspensionModal({
                                                            open: true,
                                                            userId: flag.senderId,
                                                            userName: flag.senderName,
                                                        });
                                                    }}
                                                    disabled={actionInProgress}
                                                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition disabled:opacity-50"
                                                >
                                                    Suspend sender
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleBanUser(flag.senderId, flag.senderName, {
                                                            messageProfanityFlagId: flag.id,
                                                        })
                                                    }
                                                    disabled={actionInProgress}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                                                >
                                                    Ban sender
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Original (matched filter)
                                                </div>
                                                <p className="whitespace-pre-wrap break-words rounded-lg bg-white border border-amber-200 p-3 font-mono text-gray-900">
                                                    {flag.originalBody}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Stored (censored)
                                                </div>
                                                <p className="whitespace-pre-wrap break-words rounded-lg bg-white border border-gray-200 p-3 font-mono text-gray-700">
                                                    {flag.censoredBody}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination
                                currentPage={profanityPage}
                                totalItems={profanityTotalCount}
                                itemsPerPage={PROFANITY_PER_PAGE}
                                loading={loading}
                                onPageChange={setProfanityPage}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Listing profanity review */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Listing moderation (profanity)</h2>
                <p className="text-gray-600 text-sm mb-4 max-w-3xl">
                    When a listing matches the profanity filter, censored text is stored on the listing; originals stay
                    on this flag for review. Dismiss when acceptable so the listing can publish; users who opt in under
                    Profile (18+) see originals and unblurred images. Suspend or ban the seller if needed.
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <label htmlFor="listingProfanitySort" className="text-sm font-semibold text-gray-700">
                        Sort by flag date
                    </label>
                    <select
                        id="listingProfanitySort"
                        value={listingProfanitySort}
                        onChange={(e) => setListingProfanitySort(e.target.value as ListingProfanityQueueSort)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                    </select>
                    <Link
                        href="/admin/profanity"
                        className="text-sm text-green font-semibold hover:underline ml-auto"
                    >
                        Whitelist / blacklist terms →
                    </Link>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    {loading ? (
                        <div className="text-gray-500 text-center py-8">Loading...</div>
                    ) : listingProfanityFlags.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">No pending listing profanity reviews</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto space-y-6">
                                {listingProfanityFlags.map((flag) => (
                                    <div key={flag.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/80">
                                        <div className="flex flex-wrap gap-4 justify-between items-start mb-3">
                                            <div>
                                                <div className="text-sm text-gray-500">{new Date(flag.createdAt).toLocaleString()}</div>
                                                <div className="font-semibold text-gray-900 mt-1">
                                                    {flag.ownerName}{" "}
                                                    <span className="font-normal text-gray-600">({flag.ownerEmail})</span>
                                                </div>
                                                <Link
                                                    href={`/market/listing/${flag.listingId}`}
                                                    className="text-sm text-green hover:underline mt-1 inline-block"
                                                >
                                                    View listing
                                                </Link>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDismissListingProfanity(flag.id)}
                                                    disabled={actionInProgress}
                                                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition disabled:opacity-50"
                                                >
                                                    Dismiss (no action)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProfanityFlagIdForAction(null);
                                                        setListingProfanityFlagIdForAction(flag.id);
                                                        setSuspensionModal({
                                                            open: true,
                                                            userId: flag.ownerId,
                                                            userName: flag.ownerName,
                                                        });
                                                    }}
                                                    disabled={actionInProgress}
                                                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition disabled:opacity-50"
                                                >
                                                    Suspend seller
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleBanUser(flag.ownerId, flag.ownerName, {
                                                            listingProfanityFlagId: flag.id,
                                                        })
                                                    }
                                                    disabled={actionInProgress}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                                                >
                                                    Ban seller
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Original (matched filter)
                                                </div>
                                                <p className="font-semibold text-gray-900">{flag.originalTitle}</p>
                                                <p className="whitespace-pre-wrap break-words rounded-lg bg-white border border-amber-200 p-3 font-mono text-gray-900 mt-2">
                                                    {flag.originalDescription}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Public (censored)
                                                </div>
                                                <p className="font-semibold text-gray-800">{flag.censoredTitle}</p>
                                                <p className="whitespace-pre-wrap break-words rounded-lg bg-white border border-gray-200 p-3 font-mono text-gray-700 mt-2">
                                                    {flag.censoredDescription}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination
                                currentPage={listingProfanityPage}
                                totalItems={listingProfanityTotalCount}
                                itemsPerPage={LISTING_PROFANITY_PER_PAGE}
                                loading={loading}
                                onPageChange={setListingProfanityPage}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Suspended Users Section */}
            {showSuspendedUsers && suspendedUsers.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Suspended & Banned Users</h2>
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                        <div className="grid grid-cols-6 font-semibold text-gray-700 mb-3">
                            <div>Name</div>
                            <div>Email</div>
                            <div>Status</div>
                            <div>Suspended Date</div>
                            <div>Expires</div>
                            <div>Action</div>
                        </div>
                        <div className="h-px my-3 bg-gray-200" />
                        {suspendedUsers.map((user) => (
                            <div key={user.userId} className="grid grid-cols-6 py-3 items-center hover:bg-red-50 rounded-xl px-2 transition">
                                <div className="truncate">{user.name}</div>
                                <div className="truncate text-sm">{user.email}</div>
                                <div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            user.status === "BANNED" ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"
                                        }`}
                                    >
                                        {user.status}
                                    </span>
                                </div>
                                <div className="text-sm">{new Date(user.suspendedAt).toLocaleDateString()}</div>
                                <div className="text-sm">{user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : "Permanent"}</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleActivateUser(user.userId, user.name)}
                                        className="px-3 py-1 bg-green text-white rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50"
                                        disabled={actionInProgress}
                                    >
                                        Activate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={suspendedUsersPage}
                        totalItems={totalSuspendedUsersCount}
                        itemsPerPage={SUSPENDED_PER_PAGE}
                        loading={loading}
                        onPageChange={setSuspendedUsersPage}
                    />
                </div>
            )}

            {/* User Directory */}
            <div>
                <h2 className="text-2xl font-bold mb-4">User Directory</h2>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-7 font-semibold text-gray-700 mb-3">
                            <div>Name</div>
                            <div>Email</div>
                            <div>Role</div>
                            <div>Transactions</div>
                            <div>Active Listings</div>
                            <div>Reports</div>
                            <div>Action</div>
                        </div>
                        <div className="h-px my-3 bg-gray-200" />
                        {loading ? (
                            <div className="text-gray-500 text-center py-8">Loading...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                {userSearchQuery ? "No users match your search" : "No users found"}
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div key={user.id}>
                                    <div
                                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                                        className="grid grid-cols-7 py-3 hover:bg-green-50 rounded-xl px-2 transition items-center cursor-pointer"
                                    >
                                        <div className="truncate">{user.name}</div>
                                        <div className="truncate text-sm">{user.email}</div>
                                        <div>{user.role}</div>
                                        <div>{user.transactions}</div>
                                        <div>{user.listings}</div>
                                        <div>{user.reports}</div>
                                        <div>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className={`size-5 transition-transform ${expandedUserId === user.id ? "rotate-180" : ""}`}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </div>
                                    </div>
                                    {expandedUserId === user.id && (
                                        <div className="bg-gray-50 px-4 py-3 rounded-lg mt-2 flex gap-2">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="px-2 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setSuspensionModal({ open: true, userId: user.id, userName: user.name })}
                                                className="px-2 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition disabled:opacity-50"
                                                disabled={actionInProgress}
                                            >
                                                Suspend
                                            </button>
                                            <button
                                                onClick={() => handleBanUser(user.id, user.name)}
                                                className="px-2 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50"
                                                disabled={actionInProgress}
                                            >
                                                Ban
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {!userSearchQuery && (
                    <Pagination
                        currentPage={usersPage}
                        totalItems={totalUsersCount}
                        itemsPerPage={USERS_PER_PAGE}
                        loading={loading}
                        onPageChange={setUsersPage}
                    />
                )}
            </div>

            {/* User Info Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-[450px] p-6 shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 text-center">Edit User Info</h3>
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col text-sm">
                                Name
                                <input name="name" value={selectedUser.name} onChange={handleChange} className="border border-gray-300 rounded-xl p-2 mt-1" />
                            </label>
                            <label className="flex flex-col text-sm">
                                Email
                                <input name="email" value={selectedUser.email} onChange={handleChange} className="border border-gray-300 rounded-xl p-2 mt-1" />
                            </label>
                            <label className="flex flex-col text-sm">
                                Role
                                <select name="role" value={selectedUser.role} onChange={handleChange} className="border border-gray-300 rounded-xl p-2 mt-1">
                                    <option>STUDENT</option>
                                    <option>FACULTY</option>
                                    <option>ADMIN</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green text-white rounded-xl hover:opacity-90 transition">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspension Modal */}
            {suspensionModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-[450px] p-6 shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 text-center">Suspend User</h3>
                        <p className="text-gray-600 mb-4">
                            Suspending: <strong>{suspensionModal.userName}</strong>
                        </p>

                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col text-sm">
                                Suspension Duration (days)
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={suspensionDays}
                                    onChange={(e) => setSuspensionDays(parseInt(e.target.value) || 1)}
                                    className="border border-gray-300 rounded-xl p-2 mt-1"
                                />
                            </label>
                            <label className="flex flex-col text-sm">
                                Reason (optional)
                                <textarea
                                    value={suspensionReason}
                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                    placeholder="Enter suspension reason..."
                                    className="border border-gray-300 rounded-xl p-2 mt-1 resize-none h-24"
                                />
                            </label>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                <p className="text-sm text-blue-800">
                                    This user will be suspended until:{" "}
                                    <strong>{new Date(new Date().getTime() + suspensionDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setSuspensionModal({ open: false, userId: "", userName: "" })}
                                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                                disabled={actionInProgress}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspendUser}
                                className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? "Suspending..." : "Suspend User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
