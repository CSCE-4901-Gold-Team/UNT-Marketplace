"use client"

import React, { useActionState, useEffect, useRef, useState } from "react";
import { createListingAction } from "@/actions/listing-create";
import { updateListingAction } from "@/actions/listing-update";
import { deleteListingAction } from "@/actions/listing-delete";
import { FormStatus } from "@/constants/FormStatus";
import { FormResponse } from "@/types/FormResponse";
import TextInput from "@/components/ui/TextInput";
import PriceInput from "@/components/ui/PriceInput";
import CategoryChipsInput from "@/components/ui/CategoryChipsInput";
import ImageUpload from "@/components/ui/ImageUpload";
import Button from "@/components/ui/Button";
import { useSearchParams } from "next/navigation";
import { toastService } from "@/lib/toast-service";
import { getCategories, getCategoriesCount } from "@/actions/category-actions";
import { previewListingProfanityForForm } from "@/actions/listing-profanity-preview";

type EditableListingStatus = "AVAILABLE" | "DRAFT";
type ListingCategory = { id: number; name: string };
type ListingImage = { url: string };
type ListingResponse = {
    title?: string;
    description?: string;
    price?: string;
    listingStatus?: "AVAILABLE" | "DRAFT" | "SOLD" | "ARCHIVED";
    isProfessorOnly?: boolean;
    categories?: ListingCategory[];
    images?: ListingImage[];
};


const initialState: FormResponse = {
    status: FormStatus.INITIALIZED
};

export default function CreateListing() {
    const searchParams = useSearchParams();
    const isEditing = searchParams.get('edit') === 'true';
    const listingId = searchParams.get('id');
    
    const [state, formAction, isPending] = useActionState(
        isEditing ? updateListingAction : createListingAction, 
        initialState
    );
    
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [listingStatus, setListingStatus] = useState<EditableListingStatus>("AVAILABLE");
    const [isProfessorOnly, setIsProfessorOnly] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<{id: number, name: string}[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const lastToastMessageRef = useRef<string | null>(null);
    const profanityPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profanityPreview, setProfanityPreview] = useState<{
        titleMatches: string[];
        descriptionMatches: string[];
        willHoldForReview: boolean;
    } | null>(null);
    const [profanityPreviewLoading, setProfanityPreviewLoading] = useState(false);

    const canSetProfessorOnly = userRole === "FACULTY" || userRole === "ADMIN";

    useEffect(() => {
        let isMounted = true;

        const loadCategories = async () => {
            setIsLoadingCategories(true);

            try {
                const totalCategories = await getCategoriesCount();
                const categories = await getCategories(totalCategories || 1, 0);

                if (!isMounted) return;

                setCategoryOptions(categories.map((category) => ({
                    id: category.id,
                    name: category.name
                })));
            } catch (error) {
                console.error("Error loading categories:", error);
                if (isMounted) {
                    toastService.toast("Failed to load categories.", "error");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCategories(false);
                }
            }
        };

        loadCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    // Load listing data if editing
    useEffect(() => {
        if (isEditing && listingId) {
            setIsLoadingData(true);
            fetch(`/api/listing/${listingId}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data: ListingResponse) => {
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setPrice(data.price || "");
                    setListingStatus((data.listingStatus === "DRAFT" ? "DRAFT" : "AVAILABLE") as EditableListingStatus);
                    setIsProfessorOnly(data.isProfessorOnly || false);
                    
                    // Set selected category IDs
                    if (data.categories && data.categories.length > 0) {
                        setSelectedCategoryIds(data.categories.map((c: { id: number }) => c.id));
                    }
                    
                    // Load existing images into selectedImages for editing
                    if (data.images && data.images.length > 0) {
                        const imageUrls = data.images.map((img) => img.url);
                        setSelectedImages(imageUrls);
                    }

                })
                .catch(err => {
                    console.error('Error loading listing:', err);
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        }
    }, [isEditing, listingId]);

    useEffect(() => {
        fetch("/api/user-role")
            .then((res) => res.ok ? res.json() : Promise.reject(new Error("Failed to load role")))
            .then((data) => setUserRole(data?.role ?? null))
            .catch(() => setUserRole(null));
    }, []);

    useEffect(() => {
        if (!canSetProfessorOnly) {
            setIsProfessorOnly(false);
        }
    }, [canSetProfessorOnly]);

    useEffect(() => {
        if (profanityPreviewTimerRef.current) {
            clearTimeout(profanityPreviewTimerRef.current);
        }
        const combined = `${title}\n${description}`.trim();
        if (!combined) {
            setProfanityPreview(null);
            setProfanityPreviewLoading(false);
            return;
        }

        setProfanityPreviewLoading(true);
        profanityPreviewTimerRef.current = setTimeout(() => {
            void (async () => {
                try {
                    const result = await previewListingProfanityForForm(title, description);
                    setProfanityPreview(result);
                } catch {
                    setProfanityPreview(null);
                } finally {
                    setProfanityPreviewLoading(false);
                }
            })();
        }, 450);

        return () => {
            if (profanityPreviewTimerRef.current) {
                clearTimeout(profanityPreviewTimerRef.current);
            }
        };
    }, [title, description]);

    useEffect(() => {
        const message = state.message?.content;
        if (!message) return;

        const isPendingReviewMessage = message.toLowerCase().includes("pending review");
        if (!isPendingReviewMessage) return;
        if (lastToastMessageRef.current === message) return;

        toastService.toast(message, "warn");
        lastToastMessageRef.current = message;
    }, [state.message]);

    const handleDelete = async () => {
        if (!listingId) return;
        setIsDeleting(true);
        try {
            await deleteListingAction(listingId);
        } catch (error) {
            console.error("Error deleting listing:", error);
            setIsDeleting(false);
        }
    };

    return (
        <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
            <div className="w-full max-w-4xl">
                <h1 className="text-4xl mb-6">{isEditing ? 'Edit Listing' : 'Create New Listing'}</h1>

                <form action={formAction} className="flex flex-col gap-4">
                    
                    {/* Hidden field for listing ID when editing */}
                    {isEditing && <input type="hidden" name="listingId" value={listingId || ""} />}
                    
                    {/* Title */}
                    <TextInput
                        inputLabel="Title"
                        name="title"
                        type="text"
                        placeholder="MacBook Pro 2020"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        validationErrors={state.validationErrors}
                        required
                    />

                    {/* Description */}
                    <TextInput
                        inputLabel="Description"
                        name="description"
                        placeholder="Like new, charger included"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        validationErrors={state.validationErrors}
                        required
                    />

                    {(title.trim() || description.trim()) && (
                        <div
                            className="rounded-lg border px-4 py-3 text-sm"
                            role="status"
                            aria-live="polite"
                            style={{
                                borderColor: profanityPreview?.willHoldForReview ? "#f59e0b" : "#d1d5db",
                                backgroundColor: profanityPreview?.willHoldForReview ? "#fffbeb" : "#f9fafb",
                            }}
                        >
                            {profanityPreviewLoading ? (
                                <p className="text-gray-600">Checking profanity filter…</p>
                            ) : profanityPreview?.willHoldForReview ? (
                                <>
                                    <p className="font-semibold text-amber-900 mb-2">
                                        This may be held for review because the following may be censored or flagged:
                                    </p>
                                    {profanityPreview.titleMatches.length > 0 && (
                                        <p className="text-gray-800 mb-1">
                                            <span className="font-medium">Title:</span>{" "}
                                            {profanityPreview.titleMatches.join(", ")}
                                        </p>
                                    )}
                                    {profanityPreview.descriptionMatches.length > 0 && (
                                        <p className="text-gray-800">
                                            <span className="font-medium">Description:</span>{" "}
                                            {profanityPreview.descriptionMatches.join(", ")}
                                        </p>
                                    )}
                                    {profanityPreview.titleMatches.length === 0 &&
                                        profanityPreview.descriptionMatches.length === 0 && (
                                            <p className="text-gray-800">
                                                Matched the profanity rules (see admin whitelist if this is a false
                                                positive).
                                            </p>
                                        )}
                                </>
                            ) : (
                                <p className="text-gray-600">
                                    No profanity filter matches in the title or description right now (admin whitelist
                                    may apply).
                                </p>
                            )}
                        </div>
                    )}

                    {/* Price */}
                    <PriceInput
                        inputLabel="Price"
                        name="price"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        validationErrors={state.validationErrors}
                        required
                    />

                    {isEditing && (
                        <div className="flex flex-col gap-1">
                            <label htmlFor="listingStatus" className="text-sm">Status</label>
                            <select
                                id="listingStatus"
                                name="listingStatus"
                                value={listingStatus}
                                onChange={(e) => setListingStatus(e.target.value as EditableListingStatus)}
                                className="border border-gray-300 rounded-md px-3 py-2"
                            >
                                <option value="AVAILABLE">AVAILABLE</option>
                                <option value="DRAFT">DRAFT</option>
                            </select>
                        </div>
                    )}

                    {/* Professor Only Checkbox */}
                    {canSetProfessorOnly && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isProfessorOnly"
                                name="isProfessorOnly"
                                checked={isProfessorOnly}
                                onChange={(e) => setIsProfessorOnly(e.target.checked)}
                                value="true"
                                className="w-4 h-4"
                            />
                            <label htmlFor="isProfessorOnly" className="text-sm">
                                Professor Only
                            </label>
                        </div>
                    )}
                    
                    {/* Image Upload - Works for both create and edit */}
                    <ImageUpload
                        inputLabel={isEditing ? "Manage Images (remove existing or add new)" : "Upload Images"}
                        name="imagePath"
                        selectedImages={selectedImages}
                        onImagesChange={setSelectedImages}
                        maxImages={5}
                    />
                    {/* Categories */}
                    <CategoryChipsInput
                        inputLabel="Categories"
                        name="categoryIds"
                        options={categoryOptions}
                        value={selectedCategoryIds}
                        onChangeAction={setSelectedCategoryIds}
                        validationErrors={state.validationErrors}
                        disabled={isPending || isLoadingData || isLoadingCategories}
                        isLoading={isLoadingCategories}
                    />

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <Button 
                            type="submit" 
                            buttonSize="lg"
                            showSpinner={isPending || state.status === FormStatus.SUCCESS}
                            disabled={isPending || isLoadingData || isLoadingCategories || state.status === FormStatus.SUCCESS}
                        >
                            {isEditing ? 'Update Listing' : 'Create Listing'}
                        </Button>
                        {isEditing && (
                            <Button 
                                type="button"
                                buttonVariant="secondary"
                                buttonSize="lg"
                                onClick={() => window.location.href = `/market/listing/${listingId}`}
                                disabled={isPending || isLoadingData || isLoadingCategories || state.status === FormStatus.SUCCESS}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>

                    {/* Delete Section (only when editing) */}
                    {isEditing && !showDeleteConfirm && (
                        <div className="mt-8 pt-6 border-t">
                            <h2 className="text-xl font-semibold mb-4">Delete</h2>
                            <Button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                buttonVariant="danger"
                            >
                                Delete Listing
                            </Button>
                        </div>
                    )}

                    {/* Delete Confirmation */}
                    {isEditing && showDeleteConfirm && (
                        <div className="mt-8 pt-6 border-t">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800 mb-4">
                                    Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleDelete}
                                        buttonVariant="danger"
                                        showSpinner={isDeleting}
                                        disabled={isDeleting}
                                    >
                                        Confirm Delete
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        buttonVariant="secondary"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </main>
    );
}
