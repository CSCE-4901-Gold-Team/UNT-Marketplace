"use client";

import React, { useState } from "react";

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
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: image.trim() || null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");

      setMessage("Profile updated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setImage(data.url);
      setMessage("Image uploaded — remember to save changes.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg || "Upload failed");
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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="enabled:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-100 disabled:bg-gray-500"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <div className="flex-1 text-right text-sm text-gray-600">{initialEmail}</div>
        
      </div>

      {message && <div className="text-sm text-gray-700">{message}</div>}
    </form>
  );
}
