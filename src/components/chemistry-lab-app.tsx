"use client";

import { useEffect, useRef } from "react";
import { legacyMarkup } from "@/lib/legacy-markup";

export default function ChemistryLabApp() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void import("@/lib/beaker-engine.js").catch((error: unknown) => {
      console.error("Chemistry Lab engine failed to load:", error);
      const loading = document.getElementById("scene-loading");
      const status = document.getElementById("scene-status-text");
      if (loading) {
        loading.classList.remove("is-hidden");
        loading.textContent = "3D scene could not start. Check WebGL support and reload.";
      }
      if (status) status.textContent = "SCENE ERROR";
    });
  }, []);

  return <div id="chemistry-lab-root" className="min-h-dvh w-full bg-[#090c0d]"
    dangerouslySetInnerHTML={{ __html: legacyMarkup }} />;
}
