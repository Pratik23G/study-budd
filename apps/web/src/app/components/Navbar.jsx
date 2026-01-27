// src/app/components/Navbar.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import BackButton from "../components/BackButton";

const navItems = [
  { href: "/features", label: "Features" },
  { href: "/pricing",  label: "Pricing"  },
  { href: "/quizzes",  label: "Quizzes"  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const showBack = pathname !== "/";

  return (
    <nav className="relative bg-gray-800 border-b-[10px] border-indigo-500">
      {/* Back button pinned to top-left of the navbar */}
      {pathname != "/" && (
        <div className="absolute left-3 top-3 z-50">
          <BackButton fallback="/" />
        </div>
      )}

      <div className="mx-auto max-w-7xl h-14 px-4 flex items-center justify-between">
        {/* push brand a bit so it doesn't overlap the back button */}
        <span className="pl-8 font-bold text-4xl text-indigo-400/80 relative z-10">
          StudyBudd
        </span>

        {/* Desktop links with your water effect classes */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={
                // your custom effect + safe positioning
                "btn btn-liquid btn-lg relative z-10 " +
                (pathname === item.href ? "text-white" : "text-indigo-100")
              }
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile: hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden w-10 h-10 grid place-content-center relative z-10"
        >
          <span className={`block h-0.5 w-6 rounded-sm bg-slate-300 transition-transform duration-300 ${open ? "translate-y-1.5 rotate-45" : "-translate-y-1.5"}`} />
          <span className={`block h-0.5 w-6 rounded-sm bg-slate-300 my-1 transition-opacity duration-300 ${open ? "opacity-0" : "opacity-100"}`} />
          <span className={`block h-0.5 w-6 rounded-sm bg-slate-300 transition-transform duration-300 ${open ? "-translate-y-1.5 -rotate-45" : "translate-y-1.5"}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className={`md:hidden border-t border-slate-700 ${open ? "block" : "hidden"}`}>
        <div className="px-4 py-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className="btn btn-liquid w-full relative z-10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
