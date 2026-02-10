"use client";

import { useState, useEffect, ChangeEvent } from "react";
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
    const [previews, setPreviews] = useState<string[]>(selectedImages);
    const [error, setError] = useState<string>("");

    // Update previews when selectedImages prop changes (for edit mode)
    useEffect(() => {
        setPreviews(selectedImages);
    }, [selectedImages]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Check if adding these files would exceed the max
        if (previews.length + files.length > maxImages) {
            setError(`You can only upload up to ${maxImages} images`);
            return;
        }

        // Client-side validation
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        const maxSize = 5 * 1024 * 1024; // 5MB per file

        const validFiles = files.filter(file => {
            if (!validTypes.includes(file.type)) {
                setError("Please upload valid image files (JPEG, PNG, GIF, or WebP)");
                return false;
            }
            if (file.size > maxSize) {
                setError("Each file must be less than 5MB");
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setError("");

        // Convert and compress files to base64 data URLs
        const readers = validFiles.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.onload = () => {
                        // Create canvas for compression
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Max dimensions (reduce size for faster upload)
                        const maxWidth = 1200;
                        const maxHeight = 1200;
                        
                        let width = img.width;
                        let height = img.height;
                        
                        // Calculate new dimensions while maintaining aspect ratio
                        if (width > height) {
                            if (width > maxWidth) {
                                height = (height * maxWidth) / width;
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = (width * maxHeight) / height;
                                height = maxHeight;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw and compress (0.7 = 70% quality for smaller size)
                        ctx?.drawImage(img, 0, 0, width, height);
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        resolve(compressedDataUrl);
                    };
                    img.src = e.target?.result as string;
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(dataUrls => {
            const newPreviews = [...previews, ...dataUrls];
            setPreviews(newPreviews);
            onImagesChange(newPreviews);
        });
    };

    const removeImage = (index: number) => {
        const newPreviews = previews.filter((_, i) => i !== index);
        setPreviews(newPreviews);
        onImagesChange(newPreviews);
    };

    return (
        <div className="space-y-2">
            {inputLabel && (
                <label className="block text-sm font-medium text-gray-700">
                    {inputLabel} ({previews.length}/{maxImages})
                </label>
            )}
            
            <div className="flex flex-col gap-4">
                {/* File input */}
                {previews.length < maxImages && (
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 w-fit">
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
                        Add Image{previews.length > 0 ? 's' : ''}
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
                {previews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative">
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-gray-300 hover:border-green-500 transition">
                                    <Image
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                {index === 0 && (
                                    <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                        Primary
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden input to store the image paths for form submission */}
            <input type="hidden" name={name} value={JSON.stringify(previews)} />
        </div>
    );
}
