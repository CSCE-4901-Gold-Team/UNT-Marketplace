import {notFound, redirect} from "next/navigation";
import Link from "next/link";
import {getListingAnalytics} from "@/actions/analytics-actions";
import ListingAnalyticsDashboard from "@/components/features/ListingAnalyticsDashboard";

export default async function ListingAnalyticsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;
    const result = await getListingAnalytics(id, 14);

    if (result.status === 404) notFound();
    if (result.status === 403) redirect("/market");
    if (result.status !== 200 || !("data" in result)) notFound();

    return (
        <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
            <div className="w-full max-w-5xl mx-auto">
                <Link href={`/market/listing/${id}`} className="text-green hover:underline mb-4 inline-block">
                    ← Back to listing
                </Link>
                <ListingAnalyticsDashboard analytics={result.data!}/>
            </div>
        </main>
    );
}
