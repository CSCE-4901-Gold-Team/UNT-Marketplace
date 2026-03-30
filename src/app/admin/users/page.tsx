import { getCurrentUserRole } from "@/actions/user-actions";
import AdminUsers from "@/components/admin/admin-users";

export default async function AdminUsersPage() {
    const userRole = await getCurrentUserRole();
    return <AdminUsers userRole={userRole} />;
}
