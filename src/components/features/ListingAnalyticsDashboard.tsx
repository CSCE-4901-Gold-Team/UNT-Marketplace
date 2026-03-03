"use client";

import type {ListingAnalyticsSummary} from "@/actions/analytics-actions";

export default function ListingAnalyticsDashboard({analytics}: { analytics: ListingAnalyticsSummary }) {
    const maxDaily = Math.max(
        1,
        ...analytics.daily.map((d) => Math.max(d.impressions, d.views, d.contactSeller))
    );

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Listing Analytics</h1>
            <p className="text-gray-600 mb-6">
                {analytics.listingTitle} · Last {analytics.windowDays} days
            </p>

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
                    <p className="text-sm text-gray-500">Contact</p>
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

            <h2 className="text-xl font-semibold mb-4">Daily Activity</h2>
            <div className="rounded-lg border p-4 overflow-x-auto">
                <div className="min-w-[760px]">
                    <div className="grid grid-cols-14 gap-2 items-end h-56">
                        {analytics.daily.map((day) => {
                            const impH = Math.max(2, Math.round((day.impressions / maxDaily) * 180));
                            const viewH = Math.max(2, Math.round((day.views / maxDaily) * 180));
                            const contactH = Math.max(2, Math.round((day.contactSeller / maxDaily) * 180));

                            return (
                                <div key={day.date} className="flex flex-col items-center gap-2">
                                    <div className="flex items-end gap-1 h-44">
                                        <div
                                            className="w-2 rounded bg-gray-300"
                                            style={{height: `${impH}px`}}
                                            title={`Impressions: ${day.impressions}`}
                                        />
                                        <div
                                            className="w-2 rounded bg-green-500"
                                            style={{height: `${viewH}px`}}
                                            title={`Views: ${day.views}`}
                                        />
                                        <div
                                            className="w-2 rounded bg-blue-500"
                                            style={{height: `${contactH}px`}}
                                            title={`Contacts: ${day.contactSeller}`}
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-500">
                                        {day.date.slice(5)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded bg-gray-300"/> Impressions
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded bg-green-500"/> Views
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded bg-blue-500"/> Contacts
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
