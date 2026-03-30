import { getCurrentUserRole } from "@/actions/user-actions";
import Admin from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
    const userRole = await getCurrentUserRole();
    return <Admin userRole={userRole} />;
}
