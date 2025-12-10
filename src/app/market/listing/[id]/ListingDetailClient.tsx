"use client";

import { useState } from "react";
import ReportListingModal from "@/components/ui/ReportListingModal";

interface ListingDetailClientProps {
    listingId: string;
}

export default function ListingDetailClient({ listingId }: ListingDetailClientProps) {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    return (
        <>
            <div className="flex gap-4 mt-6">
                <button className="flex-1 bg-green text-white py-3 rounded-lg hover:opacity-90">
                    Contact Seller
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Share
                </button>
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    title="Report this listing"
                >
                    Report
                </button>
            </div>

            <ReportListingModal
                listingId={listingId}
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </>
    );
}
