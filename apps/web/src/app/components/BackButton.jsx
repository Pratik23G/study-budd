// src/app/components/BackButton.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BackButton({
  fallback = "/",
  label = "Back",
  iconOnly = true,
  className = "inline-flex items-center justify-center w-9 h-9 rounded-md text-indigo-100 hover:bg-indigo-600 hover:text-white"
}) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(window.history.length > 1);
    }
  }, []);

  function handleClick() {
    // Try history.back()
    const prevPath = typeof window !== "undefined" ? window.location.pathname : "";
    router.back();

    // If nothing changed after a tick, push fallback
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname === prevPath) {
        router.push(fallback);
      }
    }, 150);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      title="Back"
      className={className + " z-20"}   // keep above any overlay
    >
      {/* chevron-left icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      {!iconOnly && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
