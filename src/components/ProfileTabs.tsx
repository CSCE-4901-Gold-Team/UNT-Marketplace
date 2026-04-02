"use client";

import React, { useState } from "react";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { SavedQueriesManager } from "@/components/SavedQueriesManager";

interface ProfileTabsProps {
  initialName: string;
  initialEmail: string;
  initialImage: string | null;
}

export function ProfileTabs({ initialName, initialEmail, initialImage }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "searches">("profile");

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-2 px-4 font-semibold transition ${
            activeTab === "profile"
              ? "border-b-2 border-green text-green"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab("searches")}
          className={`pb-2 px-4 font-semibold transition ${
            activeTab === "searches"
              ? "border-b-2 border-green text-green"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Saved Searches
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "profile" && (
          <ProfileEditor initialName={initialName} initialEmail={initialEmail} initialImage={initialImage} />
        )}
        {activeTab === "searches" && <SavedQueriesManager />}
      </div>
    </div>
  );
}
