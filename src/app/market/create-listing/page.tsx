"use client"

import { useFormState } from "react-dom";
import { createListingAction } from "@/actions/listing-create";
import { FormStatus } from "@/constants/FormStatus";
import { FormResponse } from "@/types/FormResponse";
import TextInput from "@/components/ui/TextInput";
import PriceInput from "@/components/ui/PriceInput";

const initialState: FormResponse = {
    status: FormStatus.INITIALIZED
};

export default function CreateListing() {
    const [state, formAction] = useFormState(createListingAction, initialState);

    return (
        <main className="min-h-screen flex items-start justify-center px-20 py-10">
            <div className="w-full max-w-1xl">
                <h1 className="text-4xl mb-6">Create New Listing</h1>

                <form action={formAction} className="max-w-2xl flex flex-col gap-4">
                
                    {/* Title */}
                    <TextInput
                        inputLabel="Title"
                        name="title"
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

                    {/* Professor Only Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isProfessorOnly"
                            name="isProfessorOnly"
                            value="true"
                        />
                        <label htmlFor="isProfessorOnly">Professor Only</label>
                    </div>

                    {/* Categories (placeholder - you'll need to fetch from DB) */}
                    <div>
                        <label htmlFor="categoryIds" className="block mb-2">Categories</label>
                        <input
                            type="hidden"
                            name="categoryIds"
                            value="[]"
                        />
                        <p className="text-sm text-gray-500">Category selection coming soon</p>
                    </div>

                    {/* Error Messages */}
                    {state.message && (
                        <div className={`p-4 rounded-lg ${
                            state.message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}>
                            {state.message.content}
                        </div>
                    )}

                    {/* Validation Errors */}
                    {state.validationErrors && (
                        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                            <ul className="list-disc list-inside">
                                {state.validationErrors.map((error, index) => (
                                    <li key={index}>{error.message}</li>
                                ))}
                            </ul>
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
