"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";

interface ImageUploadProps {
    name: string;
    inputLabel?: string;
    selectedImages: string[];
    onImagesChange: (dataUrls: string[]) => void;
    maxImages?: number;
}

export default function ImageUpload({ 
    name, 
    inputLabel = "Upload Images", 
    selectedImages,
    onImagesChange,
    maxImages = 5
}: ImageUploadProps) {
    const [error, setError] = useState<string>("");

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Check if adding these files would exceed max images
        if (selectedImages.length + files.length > maxImages) {
            setError(`You can only upload up to ${maxImages} images`);
            return;
        }

        setError("");

        // Process each file
        Array.from(files).forEach((file) => {
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

            // Convert file to base64 data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                onImagesChange([...selectedImages, dataUrl]);
            };
            reader.readAsDataURL(file);
        });

        // Clear the input so the same file can be selected again if needed
        e.target.value = '';
    };

    const removeImage = (indexToRemove: number) => {
        onImagesChange(selectedImages.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="space-y-2">
            {inputLabel && (
                <label className="block text-sm font-medium text-black dark:text-gray-200">
                    {inputLabel}
                </label>
            )}
            
            <div className="flex flex-col gap-4">
                {/* File input */}
                {selectedImages.length < maxImages && (
                    <label className="cursor-pointer inline-flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 transition-colors">
                        <svg 
                            className="w-5 h-5 mr-2 shrink-0" 
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
                        Choose Images ({selectedImages.length}/{maxImages})
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                )}

                {/* Error message */}
                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                {/* Image previews grid */}
                {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {selectedImages.map((image, index) => (
                            <div key={index} className="relative group">
                                <div className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-green-500">
                                    <Image
                                        src={image}
                                        alt={`Preview ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 sm:p-1 hover:bg-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                                    aria-label="Remove image"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
