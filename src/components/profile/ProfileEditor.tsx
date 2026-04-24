"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { toastService } from "@/lib/toast-service";
import { updateProfileAction, uploadProfileImageAction } from "@/actions/profile-actions";

interface Props {
  initialName?: string | null;
  initialEmail?: string | null;
  initialImage?: string | null;
}

export default function ProfileEditor({ initialName, initialEmail, initialImage }: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [image, setImage] = useState(initialImage ?? "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfileAction({ name: name.trim(), image: image.trim() || null });

      if (!result.success) throw new Error(result.error || "Failed to update profile");

      toastService.toast("Profile updated successfully", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toastService.toast(msg || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    try {
      const result = await uploadProfileImageAction(file, image || undefined);

      if (!result.success) throw new Error(result.error || "Upload failed");

      setImage(result.url || "");
      toastService.toast("Image uploaded — remember to save changes.", "info");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg || "Upload failed");
      toastService.toast(msg || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="w-28 h-28">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name || "avatar"} className="w-28 h-28 rounded-full object-cover" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-500">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="Your name"
          />

          <label className="block text-sm font-medium text-gray-600 mt-3">Profile image URL</label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="https://..."
          />

          <label className="block text-sm font-medium text-gray-600 mt-3">Or upload an image</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadFile(e.target.files ? e.target.files[0] : null)}
              className="border rounded px-2 py-1"
            />
            <div className="text-sm text-gray-500">{uploading ? "Uploading..." : uploadError}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Button
          type="submit"
          disabled={loading}
          showSpinner={loading}
          buttonSize="lg"
        >
          Save
        </Button>
        <div className="flex-1 text-right text-sm text-gray-600">{initialEmail}</div>
      </div>
    </form>
  );
}
