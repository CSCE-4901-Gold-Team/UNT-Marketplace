"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";

export interface ImageUploadState {
    newBase64: string[];
    existingUrls: string[];
    removedUrls: string[];
}

interface ImageUploadProps {
    inputLabel?: string;
    initialImages: string[];
    onStateChange: (state: ImageUploadState) => void;
    maxImages?: number;
}

type ImageItem = {
    displayUrl: string;
    isNew: boolean;
    base64?: string;
    serverUrl?: string;
};

export default function ImageUpload({
    inputLabel = "Upload Images",
    initialImages,
    onStateChange,
    maxImages = 5,
}: ImageUploadProps) {
    const [previews, setPreviews] = useState<ImageItem[]>([]);
    const [removedUrls, setRemovedUrls] = useState<string[]>([]);
    const [uploading, setUploading] = useState<Record<number, boolean>>({});
    const [error, setError] = useState<string>("");
    const prevInitialRef = useRef<string[]>(initialImages);

    useEffect(() => {
        const prev = prevInitialRef.current;
        const prevSet = new Set(prev);
        const currentSet = new Set(initialImages);

        const changed =
            initialImages.length !== prev.length ||
            initialImages.some((url) => !prevSet.has(url));

        if (!changed) return;

        prevInitialRef.current = initialImages;

        setPreviews((currentPreviews) => {
            const newItems = currentPreviews.filter(
                (item) => item.isNew && item.base64,
            );

            return [
                ...initialImages.map((url) => ({
                    displayUrl: url,
                    isNew: false,
                    serverUrl: url,
                })),
                ...newItems,
            ];
        });

        setRemovedUrls((currentRemoved) =>
            currentRemoved.filter((url) => !currentSet.has(url)),
        );
    }, [initialImages]);

    useEffect(() => {
        const newBase64 = previews
            .filter((item) => item.isNew && item.base64)
            .map((item) => item.base64!);
        const existingUrls = previews
            .filter((item) => !item.isNew && item.serverUrl)
            .map((item) => item.serverUrl!);

        onStateChange({
            newBase64,
            existingUrls,
            removedUrls,
        });
    }, [previews, removedUrls, onStateChange]);

    const compressToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement("img");
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    const maxWidth = 1200;
                    const maxHeight = 1200;

                    let width = img.width;
                    let height = img.height;

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

                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error("Failed to compress image"));
                                return;
                            }

                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = () => reject(new Error("Failed to read compressed image"));
                            reader.readAsDataURL(new File([blob], file.name, { type: "image/jpeg" }));
                        },
                        "image/jpeg",
                        0.7,
                    );
                };
                img.onerror = () => reject(new Error("Failed to load image"));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (previews.length + files.length > maxImages) {
            setError(`You can only upload up to ${maxImages} images`);
            return;
        }

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        const maxSize = 5 * 1024 * 1024;

        const validFiles = files.filter((file) => {
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

        const startIndex = previews.length;

        for (let i = 0; i < validFiles.length; i++) {
            const fileIndex = startIndex + i;
            setUploading((prev) => ({ ...prev, [fileIndex]: true }));

            try {
                const base64 = await compressToBase64(validFiles[i]);

                setPreviews((prev) => [
                    ...prev,
                    { displayUrl: base64, isNew: true, base64 },
                ]);
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to process image";
                setError(msg);
            } finally {
                setUploading((prev) => {
                    const next = { ...prev };
                    delete next[fileIndex];
                    return next;
                });
            }
        }
    };

    const removeImage = (index: number) => {
        const item = previews[index];

        if (item.serverUrl) {
            setRemovedUrls((prev) => [...prev, item.serverUrl!]);
        }

        const newPreviews = previews.filter((_, i) => i !== index);
        setPreviews(newPreviews);
    };

    return (
        <div className="space-y-2">
            {inputLabel && (
                <label className="block text-sm font-medium text-gray-700">
                    {inputLabel} ({previews.length}/{maxImages})
                </label>
            )}

            <div className="flex flex-col gap-4">
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
                        Add Image{previews.length > 0 ? "s" : ""}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                {previews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative">
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-gray-300 hover:border-green-500 transition">
                                    <Image
                                        src={preview.displayUrl}
                                        alt={`Preview ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    {uploading[index] && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                                        </div>
                                    )}
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
        </div>
    );
}
