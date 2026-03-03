"use client";

import {useEffect, useState, useTransition} from "react";
import ReportListingModal from "@/components/ui/ReportListingModal";
import {getOrCreateConversation} from "@/actions/chat-actions";
import {useRouter} from "next/navigation";
import {EventType} from "@prisma/client";
import {fireContactSeller, fireEvent} from "@/actions/analytics-actions";

interface ListingDetailClientProps {
    listingId: string;
    isOwner: boolean;
}

export default function ListingDetailClient({ listingId, isOwner }: ListingDetailClientProps) {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [contactError, setContactError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        void fireEvent(EventType.LISTING_VIEW, listingId);
    }, [listingId]);

    const handleContactSeller = () => {
        setContactError(null);
        startTransition(async () => {
            try {
                void fireContactSeller(listingId).catch(() => undefined);

                const { conversationId } = await getOrCreateConversation(listingId);
                router.push(`/market/messages/${conversationId}`);
            } catch (e: unknown) {
                setContactError(e instanceof Error ? e.message : "Could not open chat");
            }
        });
    };

    return (
        <>
            <div className="flex gap-4 mt-6">
                {!isOwner && (
                    <button
                        onClick={handleContactSeller}
                        disabled={isPending}
                        className="flex-1 bg-green text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isPending ? "Opening chat…" : "Contact Seller"}
                    </button>
                )}
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

            {contactError && (
                <p className="mt-2 text-sm text-red-600">{contactError}</p>
            )}

            <ReportListingModal
                listingId={listingId}
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </>
    );
}
