import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/actions/user-actions";
import AdminProfanityTerms from "@/components/admin/admin-profanity-terms";

export default async function AdminProfanityPage() {
    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        redirect("/market");
    }

    return (
        <main className="px-8 py-8 lg:px-20 lg:py-12 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                    <Link href="/admin" className="text-green text-sm font-semibold hover:underline mb-2 inline-block">
                        ← Admin dashboard
                    </Link>
                    <h1 className="text-4xl font-bold">Profanity lists</h1>
                    <p className="text-gray-600 mt-2">Manage whitelist and blacklist terms for listings, messages, and reports.</p>
                </div>
                <Link
                    href="/admin/users"
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                    Users & queues
                </Link>
            </div>

            <AdminProfanityTerms userRole={userRole} />
        </main>
    );
}
