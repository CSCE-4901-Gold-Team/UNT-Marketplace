"use client";

import type {ListingAnalyticsSummary} from "@/actions/analytics-actions";
import Link from "next/link";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import {Line} from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
);

const WINDOWS = [7, 14, 30, 60, 90] as const;

export default function ListingAnalyticsDashboard({
    analytics,
    listingId,
    selectedWindowDays,
}: {
    analytics: ListingAnalyticsSummary;
    listingId: string;
    selectedWindowDays: number;
}) {
    const labels = analytics.daily.map((d) => d.date.slice(5)); // MM-DD

    const chartData = {
        labels,
        datasets: [
            {
                label: "Impressions",
                data: analytics.daily.map((d) => d.impressions),
                borderColor: "rgb(156, 163, 175)",
                backgroundColor: "rgba(156, 163, 175, 0.18)",
                tension: 0.3,
                fill: true,
                pointRadius: 3,
            },
            {
                label: "Views",
                data: analytics.daily.map((d) => d.views),
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.12)",
                tension: 0.3,
                fill: true,
                pointRadius: 3,
            },
            {
                label: "Contacts",
                data: analytics.daily.map((d) => d.contactSeller),
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.12)",
                tension: 0.3,
                fill: true,
                pointRadius: 3,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: "top" as const,
            },
            tooltip: {
                backgroundColor: "rgba(17, 24, 39, 0.95)",
                titleColor: "#fff",
                bodyColor: "#fff",
            },
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(0, 0, 0, 0.06)",
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0 as const,
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.06)",
                },
            },
        },
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Listing Analytics</h1>
            <p className="text-gray-600 mb-4">{analytics.listingTitle}</p>

            <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-gray-500 mr-1">Date range:</span>
                {WINDOWS.map((days) => {
                    const isActive = days === selectedWindowDays;
                    return (
                        <Link
                            key={days}
                            href={`/market/listing/${listingId}/analytics?days=${days}`}
                            className={`px-3 py-1.5 rounded border text-sm transition no-underline ${
                                isActive
                                    ? "bg-green-600 text-white border-green-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {days}d
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">Impressions</p>
                    <p className="text-2xl font-bold">{analytics.totals.impressions}</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">Views</p>
                    <p className="text-2xl font-bold">{analytics.totals.views}</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">Contacts</p>
                    <p className="text-2xl font-bold">{analytics.totals.contactSeller}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">Impression → View</p>
                    <p className="text-xl font-semibold">{analytics.conversionRates.impressionToViewPct}%</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">View → Contact</p>
                    <p className="text-xl font-semibold">{analytics.conversionRates.viewToContactPct}%</p>
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Daily Activity ({selectedWindowDays} days)</h2>
            <div className="rounded-lg border p-4">
                <div className="h-[340px]">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
}
