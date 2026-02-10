"use client"

import { useActionState } from "react";
import { createListingAction } from "@/actions/listing-create";
import { FormStatus } from "@/constants/FormStatus";
import { FormResponse } from "@/types/FormResponse";
import TextInput from "@/components/ui/TextInput";
import PriceInput from "@/components/ui/PriceInput";
import CategoryInput from "@/components/ui/CategoryInput";
import ImageUpload from "@/components/ui/ImageUpload";
import React, { useState } from "react";


const initialState: FormResponse = {
    status: FormStatus.INITIALIZED
};

export default function CreateListing() {
    const [state, formAction] = useActionState(createListingAction, initialState);
    const [selected, setSelected] = useState<number[]>([]);
    const [selectedImage, setSelectedImage] = useState<string>("");

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
                        validationErrors={state.validationErrors}
                        required
                    />

                    {/* Description */}
                    <TextInput
                        inputLabel="Description"
                        name="description"
                        placeholder="Like new, charger included"
                        validationErrors={state.validationErrors}
                        required
                    />

                    {/* Price */}
                    <PriceInput
                        inputLabel="Price"
                        name="price"
                        placeholder="0.00"
                        validationErrors={state.validationErrors}
                        required
                    />

                    {/* Image Upload */}
                    <ImageUpload
                        inputLabel="Upload an Image"
                        name="imagePath"
                        selectedImage={selectedImage}
                        onImageChange={setSelectedImage}
                    />

                    {/* Categories */}
                    <CategoryInput
                        inputLabel="Categories"
                        name="categoryIds"
                        options={[]}
                        value={selected}
                        onChange={setSelected}
                        validationErrors={state.validationErrors}
                    />

                    {/* Error/Success Messages */}
                    {state.message && (
                        <div className={`p-4 rounded-lg ${
                            state.message.type === "error" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        }`}>
                            {state.message.content}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="bg-green text-white px-6 py-3 rounded-lg hover:opacity-90"
                    >
                        Create Listing
                    </button>
                </form>
            </div>
        </main>
    );
}
