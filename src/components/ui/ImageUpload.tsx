"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";

interface ImageUploadProps {
    name: string;
    inputLabel?: string;
    selectedImage: string;
    onImageChange: (dataUrl: string) => void;
}

export default function ImageUpload({ 
    name, 
    inputLabel = "Upload Image", 
    selectedImage,
    onImageChange 
}: ImageUploadProps) {
    const [preview, setPreview] = useState<string>(selectedImage);
    const [error, setError] = useState<string>("");

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setError("File size must be less than 5MB");
            return;
        }

        setError("");

        // Convert file to base64 data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPreview(dataUrl);
            onImageChange(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-2">
            {inputLabel && (
                <label className="block text-sm font-medium text-gray-700">
                    {inputLabel}
                </label>
            )}
            
            <div className="flex flex-col items-center gap-4">
                {/* File input */}
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                    <svg 
                        className="w-5 h-5 mr-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                        />
                    </svg>
                    Choose Image
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>

                {/* Error message */}
                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                {/* Image preview */}
                {preview && (
                    <div className="relative w-full max-w-md">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-green-500">
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setPreview("");
                                onImageChange("");
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Hidden input to store the image path for form submission */}
            <input type="hidden" name={name} value={selectedImage} />
        </div>
    );
}
