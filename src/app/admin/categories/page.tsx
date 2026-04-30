import { getCurrentUserRole } from "@/actions/user-actions";
import AdminCategories from "@/components/admin/admin-categories";

export default async function AdminCategoriesPage() {
    const userRole = await getCurrentUserRole();
    return <AdminCategories userRole={userRole} />;
}
