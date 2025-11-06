"use client"
import { useState } from "react";
import Link from "next/link";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    transactions: number;
    listings: number;
    reports: number;
}

export default function Admin() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        return;
    }

    function handleSave() {
        return;
    }

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div>
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">Overview of marketplace activity and management tools</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Total Users</div>
                    <div className="text-3xl font-black text-green">1,247</div>
                    <div className="text-xs text-gray-400 mt-1">+12% this month</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Active Listings</div>
                    <div className="text-3xl font-black text-green">342</div>
                    <div className="text-xs text-gray-400 mt-1">+8% this month</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Pending Reports</div>
                    <div className="text-3xl font-black text-orange-500">7</div>
                    <div className="text-xs text-gray-400 mt-1">Requires attention</div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="text-gray-500 text-sm font-semibold mb-2">Total Transactions</div>
                    <div className="text-3xl font-black text-green">589</div>
                    <div className="text-xs text-gray-400 mt-1">+15% this month</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-green">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold">New listing created</div>
                                    <div className="text-sm text-gray-500">Foundations of Cybersecurity textbook - $85</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-400">2 min ago</div>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-blue-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold">New user registered</div>
                                    <div className="text-sm text-gray-500">john.doe@unt.edu</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-400">15 min ago</div>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-orange-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold">Listing reported</div>
                                    <div className="text-sm text-gray-500">MacBook Pro 2019 - Suspicious</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-400">1 hour ago</div>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-green">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold">Transaction completed</div>
                                    <div className="text-sm text-gray-500">Calculus textbook - $45</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-400">3 hours ago</div>
                        </div>
                    </div>
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

                    {[
                        {
                            id: 1,
                            title: "Intro to Programming Textbook",
                            seller: "alex.johnson@unt.edu",
                            category: "Books",
                            price: "$45",
                            date: "Oct 29, 2025",
                        },
                        {
                            id: 2,
                            title: "TI-84 Calculator",
                            seller: "maria.gomez@unt.edu",
                            category: "Electronics",
                            price: "$60",
                            date: "Oct 28, 2025",
                        },
                        {
                            id: 3,
                            title: "Dorm Mini Fridge",
                            seller: "sam.lee@unt.edu",
                            category: "Appliances",
                            price: "$75",
                            date: "Oct 27, 2025",
                        },
                    ].map((listing) => (
                        <div
                            key={listing.id}
                            className="grid grid-cols-6 py-3 items-center hover:bg-green-50 rounded-xl px-2 transition"
                        >
                            <div>{listing.title}</div>
                            <div>{listing.seller}</div>
                            <div>{listing.category}</div>
                            <div>{listing.price}</div>
                            <div>{listing.date}</div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-green text-white rounded-xl text-sm hover:opacity-90 transition">
                                    Approve
                                </button>
                                <button className="px-3 py-1 bg-red-500 text-white rounded-xl text-sm hover:opacity-90 transition">
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/*User Directory*/}
            <div>
                <h2 className="text-2xl font-bold mb-4">User Directory</h2>

                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="grid grid-cols-6 font-semibold text-gray-700 mb-3">
                        <div>Name</div>
                        <div>Email</div>
                        <div>Role</div>
                        <div>Transactions</div>
                        <div>Active Listings</div>
                        <div>Reports</div>
                    </div>
                    <div className="h-px my-3 bg-gray-200" />

                    {[
                        { id: 1, name: "John Doe", email: "john.doe@unt.edu", role: "User", transactions: 5, listings: 2, reports: 0 },
                        { id: 2, name: "Jane Smith", email: "jane.smith@unt.edu", role: "Admin", transactions: 12, listings: 4, reports: 1 },
                        { id: 3, name: "David Lin", email: "david.lin@unt.edu", role: "User", transactions: 3, listings: 1, reports: 0 },
                    ].map((user) => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className="grid grid-cols-6 py-3 cursor-pointer hover:bg-green-50 rounded-xl px-2 transition"
                        >
                            <div>{user.name}</div>
                            <div>{user.email}</div>
                            <div>{user.role}</div>
                            <div>{user.transactions}</div>
                            <div>{user.listings}</div>
                            <div>{user.reports}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Info Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-[450px] p-6 shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 text-center">Edit User Info</h3>
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col text-sm">
                                Name
                                <input
                                    name="name"
                                    value={selectedUser.name}
                                    onChange={handleChange}
                                    className="border border-gray-300 rounded-xl p-2 mt-1"
                                />
                            </label>
                            <label className="flex flex-col text-sm">
                                Email
                                <input
                                    name="email"
                                    value={selectedUser.email}
                                    onChange={handleChange}
                                    className="border border-gray-300 rounded-xl p-2 mt-1"
                                />
                            </label>
                            <label className="flex flex-col text-sm">
                                Role
                                <select
                                    name="role"
                                    value={selectedUser.role}
                                    onChange={handleChange}
                                    className="border border-gray-300 rounded-xl p-2 mt-1"
                                >
                                    <option>User</option>
                                    <option>Admin</option>
                                    <option>Moderator</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green text-white rounded-xl hover:opacity-90 transition"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-green rounded-3xl h-[200px] flex items-center justify-center text-white cursor-pointer hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                            </svg>
                            <div className="text-xl font-bold">Review Users</div>
                        </div>
                    </div>
                    <div className="bg-green rounded-3xl h-[200px] flex items-center justify-center text-white cursor-pointer hover:shadow-xl transition-shadow">
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
