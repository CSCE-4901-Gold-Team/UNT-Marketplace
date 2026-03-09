"use client";

// Toast messages for server component listing page
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toastService } from "@/lib/toast-service";

export default function ListingSuccessToast() {
    const searchParams = useSearchParams();
    const created = searchParams.get("created");
    const requiresApproval = searchParams.get("requiresApproval");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");
    const hasShownRef = useRef(false);

    useEffect(() => {
        if (hasShownRef.current) return;

        if (created === "true") {
            if (requiresApproval === "true") {
                toastService.toast("Your first listing requires admin approval before it becomes available.", "info");
            } else {
                toastService.toast("Listing created successfully!", "success");
            }
            hasShownRef.current = true;
            return;
        }

        if (updated === "true") {
            toastService.toast("Listing updated successfully!", "success");
            hasShownRef.current = true;
            return;
        }

        if (deleted === "true") {
            toastService.toast("Listing deleted successfully!", "success");
            hasShownRef.current = true;
        }
    }, [created, requiresApproval, updated, deleted]);

    return null;
}
