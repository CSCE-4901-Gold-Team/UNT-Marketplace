"use client"

import React, { useEffect, useRef, useState } from "react";
import * as z from "zod";
import { createListingAction } from "@/actions/listing-create";
import { updateListingAction } from "@/actions/listing-update";
import { deleteListingAction } from "@/actions/listing-delete";
import { getListingById } from "@/actions/listing-actions";
import { getCurrentUserRole } from "@/actions/user-actions";
import { FormStatus } from "@/constants/FormStatus";
import { FormResponse } from "@/types/FormResponse";
import TextInput from "@/components/ui/TextInput";
import PriceInput from "@/components/ui/PriceInput";
import CategoryChipsInput from "@/components/ui/CategoryChipsInput";
import ImageUpload, { ImageUploadState } from "@/components/ui/ImageUpload";
import Button from "@/components/ui/Button";
import { useSearchParams } from "next/navigation";
import { toastService } from "@/lib/toast-service";
import { getCategories, getCategoriesCount } from "@/actions/category-actions";

type EditableListingStatus = "AVAILABLE" | "DRAFT";
type ListingCategory = { id: number; name: string };
type ListingImage = { url: string };
type ListingResponse = {
    id?: string;
    title?: string;
    description?: string;
    price?: string;
    listingStatus?: "AVAILABLE" | "DRAFT" | "SOLD" | "ARCHIVED" | string;
    isProfessorOnly?: boolean;
    categories?: ListingCategory[];
    images?: ListingImage[];
};

export default function CreateListing() {
    const searchParams = useSearchParams();
    const isEditing = searchParams.get('edit') === 'true';
    const listingId = searchParams.get('id');

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [listingStatus, setListingStatus] = useState<EditableListingStatus>("AVAILABLE");
    const [isProfessorOnly, setIsProfessorOnly] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<{id: number, name: string}[]>([]);
    const [initialImages, setInitialImages] = useState<string[]>([]);
    const [imageUploadState, setImageUploadState] = useState<ImageUploadState>({
        newBase64: [],
        existingUrls: [],
        removedUrls: [],
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<z.core.$ZodIssue[]>([]);
    const formRef = useRef<HTMLFormElement>(null);
    const lastToastMessageRef = useRef<string | null>(null);

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

    useEffect(() => {
        if (isEditing && listingId) {
            setIsLoadingData(true);
            getListingById(listingId)
                .then((data: ListingResponse) => {
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setPrice(data.price || "");
                    setListingStatus((data.listingStatus === "DRAFT" ? "DRAFT" : "AVAILABLE") as EditableListingStatus);
                    setIsProfessorOnly(data.isProfessorOnly || false);

                    if (data.categories && data.categories.length > 0) {
                        setSelectedCategoryIds(data.categories.map((c: { id: number }) => c.id));
                    }

                    if (data.images && data.images.length > 0) {
                        const imageUrls = data.images.map((img) => img.url);
                        setInitialImages(imageUrls);
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
        getCurrentUserRole()
            .then((role) => setUserRole(role))
            .catch(() => setUserRole(null));
    }, []);

    useEffect(() => {
        if (!canSetProfessorOnly) {
            setIsProfessorOnly(false);
        }
    }, [canSetProfessorOnly]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setValidationErrors([]);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("isProfessorOnly", isProfessorOnly.toString());
        formData.append("categoryIds", JSON.stringify(selectedCategoryIds));
        formData.append("newImagesBase64", JSON.stringify(imageUploadState.newBase64));
        formData.append("existingImageUrls", JSON.stringify(imageUploadState.existingUrls));

        if (isEditing && listingId) {
            formData.append("listingId", listingId);
            formData.append("listingStatus", listingStatus);
            formData.append("removedImageUrls", JSON.stringify(imageUploadState.removedUrls));
        }

        let result: FormResponse;
        try {
            result = isEditing
                ? await updateListingAction({ status: FormStatus.INITIALIZED }, formData)
                : await createListingAction({ status: FormStatus.INITIALIZED }, formData);
        } catch (error) {
            const errObj = error as { digest?: string };
            if (errObj?.digest?.startsWith?.("NEXT_REDIRECT")) {
                return;
            }
            console.error("Unexpected error:", error);
            setSubmitError("An unexpected error occurred");
            setIsSubmitting(false);
            return;
        }

        if (result.status === FormStatus.SUCCESS) {
            toastService.toast("Listing saved successfully", "success");
        } else if (result.validationErrors && result.validationErrors.length > 0) {
            setValidationErrors(result.validationErrors);
            toastService.toast("Please fix the validation errors", "error");
        } else if (result.message?.content) {
            const msg = result.message.content.toLowerCase();
            if (msg.includes("pending review")) {
                toastService.toast(result.message.content, "warn");
            } else {
                setSubmitError(result.message.content);
                toastService.toast(result.message.content, "error");
            }
        }

        setIsSubmitting(false);
    };

    useEffect(() => {
        const message = submitError;
        if (!message) return;
        if (lastToastMessageRef.current === message) return;

        lastToastMessageRef.current = message;
    }, [submitError]);

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

                <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">

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
                        validationErrors={validationErrors}
                        required
                    />

                    {/* Description */}
                    <TextInput
                        inputLabel="Description"
                        name="description"
                        placeholder="Like new, charger included"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        validationErrors={validationErrors}
                        required
                    />

                    {/* Price */}
                    <PriceInput
                        inputLabel="Price"
                        name="price"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        validationErrors={validationErrors}
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
                        initialImages={initialImages}
                        onStateChange={setImageUploadState}
                        maxImages={5}
                    />
                    {/* Categories */}
                    <CategoryChipsInput
                        inputLabel="Categories"
                        name="categoryIds"
                        options={categoryOptions}
                        value={selectedCategoryIds}
                        onChange={setSelectedCategoryIds}
                        validationErrors={validationErrors}
                        disabled={isSubmitting || isLoadingData || isLoadingCategories}
                        isLoading={isLoadingCategories}
                    />

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <Button
                            type="submit"
                            buttonSize="lg"
                            showSpinner={isSubmitting}
                            disabled={isSubmitting || isLoadingData || isLoadingCategories}
                        >
                            {isEditing ? 'Update Listing' : 'Create Listing'}
                        </Button>
                        {isEditing && (
                            <Button
                                type="button"
                                buttonVariant="secondary"
                                buttonSize="lg"
                                onClick={() => window.location.href = `/market/listing/${listingId}`}
                                disabled={isSubmitting || isLoadingData || isLoadingCategories}
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
