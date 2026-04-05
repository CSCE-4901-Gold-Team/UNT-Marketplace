import { getCurrentUserRole } from "@/actions/user-actions";
import AdminListings from "@/components/admin/admin-listings";

export default async function AdminListingsPage() {
    const userRole = await getCurrentUserRole();
    return <AdminListings userRole={userRole} />;
}
