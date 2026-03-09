import { getCurrentUserRole } from "@/actions/user-actions";
import AdminReports from "./admin-reports";

export default async function AdminReportsPage() {
    const userRole = await getCurrentUserRole();
    return <AdminReports userRole={userRole} />;
}
