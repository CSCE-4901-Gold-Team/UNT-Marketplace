"use client";

import { useState } from "react";
import { submitListingReport } from "@/actions/listing-reports";
import { CreateReportInput } from "@/schemas/report-schemas";

const REPORT_REASONS = [
    { value: "FRAUDULENT", label: "Fraudulent/Scam" },
    { value: "OFFENSIVE_CONTENT", label: "Offensive Content" },
    { value: "INAPPROPRIATE", label: "Inappropriate" },
    { value: "INCORRECT_DESCRIPTION", label: "Incorrect Description" },
    { value: "DUPLICATE_LISTING", label: "Duplicate Listing" },
    { value: "NOT_AVAILABLE", label: "Item Not Available" },
    { value: "SCAM", label: "Suspicious Activity" },
    { value: "OTHER", label: "Other" },
];

interface ReportListingModalProps {
    listingId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportListingModal({
    listingId,
    isOpen,
    onClose,
}: ReportListingModalProps) {
    const [reason, setReason] = useState<string>("");
    const [details, setDetails] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason) {
            setMessage({ type: "error", text: "Please select a reason for reporting" });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        const input: CreateReportInput = {
            listingId,
            reason: reason as any,
            details: details.trim() || undefined,
        };

        const result = await submitListingReport(input);

        if (result.success) {
            setMessage({ type: "success", text: result.message });
            setReason("");
            setDetails("");
            setTimeout(() => {
                onClose();
                setMessage(null);
            }, 2000);
        } else {
            setMessage({ type: "error", text: result.message });
        }

        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4">Report Listing</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reason Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Report <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
                            disabled={isSubmitting}
                        >
                            <option value="">Select a reason...</option>
                            {REPORT_REASONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Details Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Details <span className="text-gray-500">(Optional)</span>
                        </label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Please provide any additional information that helps us understand your report..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent resize-none"
                            rows={4}
                            maxLength={1000}
                            disabled={isSubmitting}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                            {details.length}/1000 characters
                        </div>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div
                            className={`p-3 rounded-lg text-sm ${
                                message.type === "success"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
