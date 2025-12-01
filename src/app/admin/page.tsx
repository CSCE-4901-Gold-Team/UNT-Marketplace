import { getCurrentUserRole } from "@/actions/user-actions";
import Admin from "./admin-dashboard";

export default async function AdminPage() {
    const userRole = await getCurrentUserRole();
    console.log(userRole);
    return <Admin userRole={userRole} />;
}
