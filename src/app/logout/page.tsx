"use server";

import {redirect} from "next/navigation";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

export default async function LogoutPage() {
    // Sign the user out and send them back to the login page
    await auth.api.signOut({
        headers: await headers(),
    });

    redirect("/login");
}
