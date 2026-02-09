"use client";

// Toast messages for server component listing page
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toastService } from "@/lib/toast-service";

export default function ListingSuccessToast() {
    const searchParams = useSearchParams();
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");
    const hasShownRef = useRef(false);

    useEffect(() => {
        if (hasShownRef.current) return;

        if (created === "true") {
            toastService.toast("Listing created successfully!", "success");
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
    }, [created, updated, deleted]);

    return null;
}
