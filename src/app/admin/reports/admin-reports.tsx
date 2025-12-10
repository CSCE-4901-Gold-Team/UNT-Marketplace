"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPendingListingReports, deleteListing, suspendUser, resolveReport } from "@/actions/admin-actions";

interface Report {
    id: string;
    listingId: string;
    listingTitle: string;
    listingDescription: string;
    listingPrice: string;
    listingImage: string | null;
    listingOwnerId: string;
    listingOwnerName: string;
    listingOwnerEmail: string;
    reporterId: string;
    reporterName: string;
    reporterEmail: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
}

export default function AdminReports({ userRole }: { userRole: string | null }) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (userRole !== "ADMIN") {
            router.push("/market");
            return;
        }

        const fetchReports = async () => {
            try {
                const reportsData = await getPendingListingReports(50);
                setReports(reportsData);
            } catch (error) {
                console.error("Error loading reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [userRole, router]);

    const handleViewListing = (listingId: string) => {
        router.push(`/market/listing/${listingId}`);
    };

    const handleDeleteListing = async (reportId: string, listingId: string) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;

        setActionInProgress(true);
        try {
            await deleteListing(listingId);
            await resolveReport(reportId, 'RESOLVED');
            setReports(reports.filter(r => r.id !== reportId));
            setSelectedReport(null);
        } catch (error) {
            console.error("Error deleting listing:", error);
            alert("Error deleting listing");
        } finally {
            setActionInProgress(false);
        }
    };

    const handleSuspendUser = async (reportId: string, userId: string) => {
        if (!confirm("Are you sure you want to suspend this user?")) return;

        setActionInProgress(true);
        try {
            await suspendUser(userId);
            await resolveReport(reportId, 'RESOLVED');
            setReports(reports.filter(r => r.id !== reportId));
            setSelectedReport(null);
        } catch (error) {
            console.error("Error suspending user:", error);
            alert("Error suspending user");
        } finally {
            setActionInProgress(false);
        }
    };

    const handleDismissReport = async (reportId: string) => {
        if (!confirm("Are you sure you want to dismiss this report?")) return;

        setActionInProgress(true);
        try {
            await resolveReport(reportId, 'DISMISSED');
            setReports(reports.filter(r => r.id !== reportId));
            setSelectedReport(null);
        } catch (error) {
            console.error("Error dismissing report:", error);
            alert("Error dismissing report");
        } finally {
            setActionInProgress(false);
        }
    };

    if (userRole !== "ADMIN") return null;

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div>
                <h1 className="text-4xl font-bold">Listing Reports</h1>
                <p className="text-gray-600 mt-2">Review and manage reported listings</p>
            </div>

            {/* Reports Table */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <div className="mb-4">
                    <div className="text-sm text-gray-600">
                        Total pending reports: <span className="font-bold">{loading ? "-" : reports.length}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-gray-500 text-center py-8">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">No pending reports</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Listing</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reporter</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="text-sm font-medium">{report.listingTitle}</div>
                                            <div className="text-xs text-gray-500">{report.listingPrice}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-sm">{report.reporterName}</div>
                                            <div className="text-xs text-gray-500">{report.reporterEmail}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-sm">{report.reason.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-sm text-gray-600">{report.createdAt}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => setSelectedReport(report)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg">
                        <h2 className="text-2xl font-bold mb-6">Report Details</h2>

                        {/* Report Info */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600 font-semibold">Report Reason</div>
                                    <div className="text-lg font-semibold mt-1">{selectedReport.reason.replace(/_/g, ' ')}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 font-semibold">Reported Date</div>
                                    <div className="text-lg font-semibold mt-1">{selectedReport.createdAt}</div>
                                </div>
                            </div>
                            {selectedReport.details && (
                                <div className="mt-4">
                                    <div className="text-sm text-gray-600 font-semibold">Report Details</div>
                                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{selectedReport.details}</div>
                                </div>
                            )}
                        </div>

                        {/* Reporter Info */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <div className="text-lg font-semibold mb-3">Reporter</div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Name</div>
                                        <div className="font-medium">{selectedReport.reporterName}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Email</div>
                                        <div className="font-medium">{selectedReport.reporterEmail}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Listing Info */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <div className="text-lg font-semibold mb-3">Reported Listing</div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex gap-4">
                                    {selectedReport.listingImage && (
                                        <img
                                            src={selectedReport.listingImage}
                                            alt={selectedReport.listingTitle}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold text-lg">{selectedReport.listingTitle}</div>
                                        <div className="text-sm text-gray-600 mt-1">{selectedReport.listingPrice}</div>
                                        <div className="text-sm text-gray-600 mt-2 line-clamp-2">{selectedReport.listingDescription}</div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Listing Owner</div>
                                        <div className="font-medium">{selectedReport.listingOwnerName}</div>
                                        <div className="text-sm text-gray-500">{selectedReport.listingOwnerEmail}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleViewListing(selectedReport.listingId)}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                                disabled={actionInProgress}
                            >
                                View Listing
                            </button>
                            <button
                                onClick={() => handleDeleteListing(selectedReport.id, selectedReport.listingId)}
                                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                Delete Listing
                            </button>
                            <button
                                onClick={() => handleSuspendUser(selectedReport.id, selectedReport.listingOwnerId)}
                                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                Suspend User
                            </button>
                            <button
                                onClick={() => handleDismissReport(selectedReport.id)}
                                className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                Dismiss Report
                            </button>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                                disabled={actionInProgress}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
