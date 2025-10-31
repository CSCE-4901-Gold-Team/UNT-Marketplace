"use client"

import { useFormState } from "react-dom";
import { createListingAction } from "@/actions/listing-create";
import { FormStatus } from "@/constants/FormStatus";
import { FormResponse } from "@/types/FormResponse";

const initialState: FormResponse = {
    status: FormStatus.SUCCESS
};

export default function CreateListing() {
    const [state, formAction] = useFormState(createListingAction, initialState);

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div>
                <h1 className="text-4xl">Create New Listing</h1>
            </div>

            <form action={formAction} className="max-w-2xl flex flex-col gap-4">
                
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block mb-2">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block mb-2">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={5}
                        required
                    />
                </div>

                {/* Price */}
                <div>
                    <label htmlFor="price" className="block mb-2">Price ($)</label>
                    <input
                        type="text"
                        id="price"
                        name="price"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                    />
                </div>

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
        </main>
    );
}
