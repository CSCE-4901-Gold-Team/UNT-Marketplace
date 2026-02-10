"use client"

import React, { useActionState, useEffect, useState } from "react";
import { createListingAction } from "@/actions/listing-create";
import { updateListingAction } from "@/actions/listing-update";
import { deleteListingAction } from "@/actions/listing-delete";
import { FormStatus } from "@/constants/FormStatus";
import { FormResponse } from "@/types/FormResponse";
import TextInput from "@/components/ui/TextInput";
import PriceInput from "@/components/ui/PriceInput";
import CategoryInput from "@/components/ui/CategoryInput";
import ImageUpload from "@/components/ui/ImageUpload";
import Button from "@/components/ui/Button";
import { useSearchParams } from "next/navigation";


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
    const [isProfessorOnly, setIsProfessorOnly] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<{id: number, name: string}[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    const canSetProfessorOnly = userRole === "FACULTY" || userRole === "ADMIN";

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
                .then(data => {
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setPrice(data.price || "");
                    setIsProfessorOnly(data.isProfessorOnly || false);
                    
                    // Set category options and selected IDs
                    if (data.categories && data.categories.length > 0) {
                        setCategoryOptions(data.categories);
                        setSelected(data.categories.map((c: any) => c.id));
                    }
                    
                    // Load existing images into selectedImages for editing
                    if (data.images && data.images.length > 0) {
                        const imageUrls = data.images.map((img: any) => img.url);
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
        <main className="min-h-screen flex items-start justify-center px-8 py-4 lg:px-20 lg:py-12 bg-white dark:bg-gray-900 text-black dark:text-white transition-colors">
            <div className="w-full max-w-1xl">
                <h1 className="text-4xl mb-6 text-black dark:text-white">Create New Listing</h1>

                <form action={formAction} className="max-w-2xl flex flex-col gap-4 text-black dark:text-white">
                    
                    {/* Title */}
                    <TextInput
                        inputLabel="Title"
                        name="title"
                        className="text-black"
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
                    <CategoryInput
                        inputLabel="Categories"
                        name="categoryIds"
                        options={categoryOptions}
                        value={selected}
                        onChange={setSelected}
                        validationErrors={state.validationErrors}
                    />

                    {/* Hidden field for images JSON */}
                    <input type="hidden" name="imagePath" value={JSON.stringify(selectedImages)} />

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        buttonVariant="primary"
                        showSpinner={isPending}
                        disabled={isPending || isLoadingData}
                    >
                        {isPending ? "Submitting..." : isEditing ? "Update Listing" : "Create Listing"}
                    </Button>

                    {/* Error/Success Messages */}
                    {state.message && (
                        <div className={`p-4 rounded-lg ${
                            state.message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}>
                            {state.message.content}
                        </div>
                    )}

                    {/* Delete Button for Editing Mode */}
                    {isEditing && !showDeleteConfirm && (
                        <Button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            buttonVariant="danger"
                        >
                            Delete Listing
                        </Button>
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
