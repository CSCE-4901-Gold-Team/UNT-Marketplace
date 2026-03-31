"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPendingListingReports, deleteListing, resolveReport } from "@/actions/admin-actions";
import { suspendUser, banUser } from "@/actions/user-actions";

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
    const [suspensionModal, setSuspensionModal] = useState<{
        open: boolean;
        userId: string;
        userName: string;
        reportId: string | null;
    }>({ open: false, userId: "", userName: "", reportId: null });
    const [suspensionDays, setSuspensionDays] = useState(7);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const REPORTS_PER_PAGE = 50;
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (userRole !== "ADMIN") {
            router.push("/market");
            return;
        }

        const fetchReports = async () => {
            try {
                const { reports: reportsData, total } = await getPendingListingReports(
                    REPORTS_PER_PAGE,
                    (currentPage - 1) * REPORTS_PER_PAGE
                );
                setReports(reportsData);
                setTotalReports(total);

                const listingParam = searchParams.get("listing");
                if (listingParam) {
                    const report = reportsData.find((r) => r.listingId === listingParam);
                    if (report) {
                        setSelectedReport(report);
                    }
                }
            } catch (error) {
                console.error("Error loading reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [userRole, router, searchParams, currentPage]);

    function renderPagination() {
        const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);
        
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
                    Showing {Math.min((currentPage - 1) * REPORTS_PER_PAGE + 1, totalReports)} - {Math.min(currentPage * REPORTS_PER_PAGE, totalReports)} of {totalReports} reports
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                        Previous
                    </button>
                    
                    {getPageNumbers().map((page, index) => (
                        typeof page === 'number' ? (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(page)}
                                disabled={loading}
                                className={`px-3 py-1 border rounded-lg transition text-sm ${
                                    currentPage === page
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
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    }

    const handleViewListing = (listingId: string) => {
        router.push(`/market/listing/${listingId}`);
    };

    const filteredReports = reports.filter(report => {
        const matchesSearch = 
            report.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.listingOwnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.reason.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

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

    const handleOpenSuspensionModal = (userId: string, userName: string, reportId: string) => {
        setSuspensionModal({ open: true, userId, userName, reportId });
    };

    const handleSuspendUser = async () => {
        if (!suspensionModal.userId || suspensionDays <= 0) {
            alert("Please enter valid suspension days");
            return;
        }

        const reportId = suspensionModal.reportId;
        if (!reportId) {
            alert("Missing report reference. Close the modal and use Suspend from a report again.");
            return;
        }

        const suspendedUserName = suspensionModal.userName;
        const days = suspensionDays;

        setActionInProgress(true);
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);

            await suspendUser(suspensionModal.userId, expiryDate);
            await resolveReport(reportId, "RESOLVED");

            setReports((prev) => prev.filter((r) => r.id !== reportId));
            setSelectedReport(null);
            setSuspensionModal({ open: false, userId: "", userName: "", reportId: null });
            setSuspensionDays(7);

            alert(`User ${suspendedUserName} suspended for ${days} days`);
        } catch (error) {
            console.error("Error suspending user:", error);
            alert("Error suspending user");
        } finally {
            setActionInProgress(false);
        }
    };

    const handleBanUser = async (reportId: string, userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to permanently ban ${userName}?`)) return;

        setActionInProgress(true);
        try {
            await banUser(userId);
            await resolveReport(reportId, 'RESOLVED');
            setReports(reports.filter(r => r.id !== reportId));
            setSelectedReport(null);
            alert(`User ${userName} has been permanently banned`);
        } catch (error) {
            console.error("Error banning user:", error);
            alert("Error banning user");
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
                    <input
                        type="text"
                        placeholder="Search reports by listing title, reporter, owner, or reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green mb-4"
                    />
                    <div className="text-sm text-gray-600">
                        {searchQuery ? (
                            <>
                                Matching this page:{" "}
                                <span className="font-bold">{loading ? "-" : filteredReports.length}</span>
                            </>
                        ) : (
                            <>
                                Total pending reports:{" "}
                                <span className="font-bold">{loading ? "-" : totalReports}</span>
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-gray-500 text-center py-8">Loading reports...</div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">{searchQuery ? 'No reports match your search' : 'No pending reports'}</div>
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
                                {filteredReports.map((report) => (
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
                {!searchQuery && renderPagination()}
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Report Details</h2>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Report Info */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600 font-semibold">Report Reason</div>
                                    <div className="text-lg font-semibold mt-1 text-red-600">{selectedReport.reason.replace(/_/g, ' ')}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 font-semibold">Reported Date</div>
                                    <div className="text-lg font-semibold mt-1">{selectedReport.createdAt}</div>
                                </div>
                            </div>
                            {selectedReport.details && (
                                <div className="mt-4">
                                    <div className="text-sm text-gray-600 font-semibold">Report Details</div>
                                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">{selectedReport.details}</div>
                                </div>
                            )}
                        </div>

                        {/* Reporter Info */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <div className="text-lg font-semibold mb-3">Reporter Information</div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Name</div>
                                        <div className="font-medium text-lg">{selectedReport.reporterName}</div>
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
                            <div className="text-lg font-semibold mb-3">Reported Listing Details</div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex gap-4 mb-4">
                                    {selectedReport.listingImage && (
                                        <img
                                            src={selectedReport.listingImage}
                                            alt={selectedReport.listingTitle}
                                            className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold text-lg mb-1">{selectedReport.listingTitle}</div>
                                        <div className="text-sm text-gray-600 mb-1 font-semibold">{selectedReport.listingPrice}</div>
                                        <div className="text-sm text-gray-600 line-clamp-3">{selectedReport.listingDescription}</div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-300">
                                    <div className="text-sm font-semibold text-gray-700 mb-2">Listing Owner</div>
                                    <div className="bg-white rounded p-3 border border-gray-200">
                                        <div className="font-medium">{selectedReport.listingOwnerName}</div>
                                        <div className="text-sm text-gray-500">{selectedReport.listingOwnerEmail}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleViewListing(selectedReport.listingId)}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                View Full Listing
                            </button>
                            <button
                                onClick={() => handleDeleteListing(selectedReport.id, selectedReport.listingId)}
                                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? 'Deleting...' : 'Delete Listing'}
                            </button>
                            <button
                                onClick={() =>
                                    handleOpenSuspensionModal(
                                        selectedReport.listingOwnerId,
                                        selectedReport.listingOwnerName,
                                        selectedReport.id
                                    )
                                }
                                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? 'Processing...' : 'Suspend User'}
                            </button>
                            <button
                                onClick={() => handleBanUser(selectedReport.id, selectedReport.listingOwnerId, selectedReport.listingOwnerName)}
                                className="w-full px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? 'Banning...' : 'Ban User'}
                            </button>
                            <button
                                onClick={() => handleDismissReport(selectedReport.id)}
                                className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? 'Dismissing...' : 'Dismiss Report'}
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

            {/* Suspension Modal */}
            {suspensionModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-[450px] p-6 shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 text-center">Suspend User</h3>
                        <p className="text-gray-600 mb-4">Suspending: <strong>{suspensionModal.userName}</strong></p>
                        
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
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                <p className="text-sm text-blue-800">
                                    This user will be suspended until: <strong>{new Date(new Date().getTime() + suspensionDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() =>
                                    setSuspensionModal({
                                        open: false,
                                        userId: "",
                                        userName: "",
                                        reportId: null,
                                    })
                                }
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
                                {actionInProgress ? 'Suspending...' : 'Suspend User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
