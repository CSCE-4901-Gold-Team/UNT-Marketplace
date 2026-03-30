"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { $Enums } from "@prisma/client";
import type { User, SuspendedUser } from "@/types/admin/users";
import { getAdminStats, getAllUsers, getSuspendedUsers } from "@/actions/admin-actions";
import { updateAdminUser, suspendUser, banUser, setUserActive } from "@/actions/user-actions";

export default function AdminUsers({ userRole }: { userRole: string | null }) {
    const router = useRouter();

    const USERS_PER_PAGE = 50;
    const SUSPENDED_PER_PAGE = 20;

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

    useEffect(() => {
        if (userRole !== "ADMIN") {
            router.push("/market");
            return;
        }

        const load = async () => {
            try {
                const [statsData, usersData, suspendedData] = await Promise.all([
                    getAdminStats(),
                    getAllUsers(USERS_PER_PAGE + 1, (usersPage - 1) * USERS_PER_PAGE),
                    getSuspendedUsers(SUSPENDED_PER_PAGE + 1, (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE),
                ]);

                setUsers(usersData.slice(0, USERS_PER_PAGE));
                setTotalUsersCount(statsData?.totalUsers || 0);

                setSuspendedUsers(suspendedData.slice(0, SUSPENDED_PER_PAGE));
                setTotalSuspendedUsersCount(
                    suspendedData.length > SUSPENDED_PER_PAGE
                        ? (suspendedUsersPage * SUSPENDED_PER_PAGE) + 1
                        : (suspendedUsersPage - 1) * SUSPENDED_PER_PAGE + suspendedData.length
                );
            } catch (e) {
                console.error("Error loading users:", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userRole, router, usersPage, suspendedUsersPage]);

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

            const updated = await getSuspendedUsers(SUSPENDED_PER_PAGE);
            setSuspendedUsers(updated);
            setUsers((prev) => prev.filter((u) => u.id !== suspensionModal.userId));
            setExpandedUserId(null);

            alert(`User ${suspensionModal.userName} suspended for ${suspensionDays} days`);
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

    async function handleBanUser(userId: string, userName: string) {
        if (!confirm(`Are you sure you want to permanently ban ${userName}?`)) return;

        setActionInProgress(true);
        try {
            await banUser(userId);
            const updated = await getSuspendedUsers(SUSPENDED_PER_PAGE);
            setSuspendedUsers(updated);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
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
                    {renderPagination(suspendedUsersPage, totalSuspendedUsersCount, SUSPENDED_PER_PAGE, setSuspendedUsersPage)}
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
                {!userSearchQuery && renderPagination(usersPage, totalUsersCount, USERS_PER_PAGE, setUsersPage)}
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
