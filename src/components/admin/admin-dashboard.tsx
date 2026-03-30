"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdminStats, getFirstListingsAwaitingApproval, getSuspendedUsers } from "@/actions/admin-actions";

export default function Admin({ userRole }: { userRole: string | null }) {
    const [stats, setStats] = useState({ totalUsers: 0, activeListings: 0, pendingReports: 0, totalTransactions: 0, suspendedCount: 0, pendingCount: 0 });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (userRole != "ADMIN") {
            router.push("/market");
            return;
        }

        const fetchData = async () => {
            try {
                const [statsData, pendingData, suspendedData] = await Promise.all([
                    getAdminStats(),
                    getFirstListingsAwaitingApproval(),
                    getSuspendedUsers()
                ]);

                setStats({ ...statsData, suspendedCount: suspendedData.length, pendingCount: pendingData.length });

            } catch (error) {
                console.error("Error loading admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userRole, router]);

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
                    <div className="text-3xl font-black text-orange-500">{loading ? "-" : stats.pendingCount}</div>
                    <div className="text-xs text-gray-400 mt-1">First listings to review</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Pending Reports</div>
                    <div className="text-3xl font-black text-red-500">{loading ? "-" : stats.pendingReports}</div>
                    <div className="text-xs text-gray-400 mt-1">Reported listings</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Suspended Users</div>
                    <div className="text-3xl font-black text-orange-600">{loading ? "-" : stats.suspendedCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Suspended or banned</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-4 gap-6">
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

                    <Link href="/admin/categories" className="bg-blue-600 rounded-3xl h-[200px] flex items-center justify-center text-white hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5m-16.5 5.25h16.5m-16.5 5.25h16.5" />
                            </svg>
                            <div className="text-xl font-bold">Categories</div>
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
