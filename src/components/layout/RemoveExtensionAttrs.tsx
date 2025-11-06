"use client";

import { useEffect } from "react";

export default function RemoveExtensionAttrs() {
  useEffect(() => {
    try {
      const body = document.body;
      if (!body) return;

      // Known extension attributes (Grammarly and similar)
      const known = [
        "data-new-gr-c-s-check-loaded",
        "data-gr-ext-installed",
        "data-gramm",
      ];

      known.forEach((a) => body.removeAttribute(a));

      // Remove any data-* attributes that start with gr or gramm
      Array.from(body.attributes).forEach((attr) => {
        if (attr.name.startsWith("data-gr") || attr.name.startsWith("data-gramm")) {
          body.removeAttribute(attr.name);
        }
      });
    } catch {
      // ignore
    }
  }, []);

  return null;
}
