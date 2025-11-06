import { getCurrentUserRole } from "@/actions/user-actions";
import Admin from "./layout";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const userRole = await getCurrentUserRole();

    if (userRole !== "ADMIN") {
        redirect("/market");
    }

    return <Admin />;
}
