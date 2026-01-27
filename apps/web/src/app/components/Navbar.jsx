"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function load() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub?.subscription?.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
  }

  const navLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`nav-pill ${active ? "nav-pill--active" : ""}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 liquid-header">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-3">
        {/* Liquid container */}
        <div className="liquid-nav rounded-2xl border border-white/10">
          <div className="relative flex items-center justify-between px-4 py-3">
            {/* Logo -> Home (S.svg) */}
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 grid place-items-center">
                <Image
                  src="/S.svg"
                  alt="StudyBudd"
                  width={40}
                  height={40}
                  priority
                  className="h-10 w-10 object-contain"
                />
              </div>

              <div className="leading-tight">
                <div className="text-white font-extrabold tracking-tight">
                  StudyBudd
                </div>
                <div className="text-xs text-white/70 -mt-0.5">
                  AI Study Companion
                </div>
              </div>
            </Link>

            {/* Links */}
            <nav className="hidden md:flex items-center gap-2">
              {navLink("/features", "Features")}
              {navLink("/pricing", "Pricing")}
              {navLink("/quizzes", "Quizzes")}
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="text-white/70 text-sm px-3">...</div>
              ) : user ? (
                <>
                  <Link
                    href="/account"
                    className="nav-pill nav-pill--ghost"
                    title={user.email ?? "Account"}
                  >
                    {user.email?.split("@")[0] ?? "Account"}
                  </Link>
                  <button onClick={signOut} className="nav-btn nav-btn--light">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-pill nav-pill--ghost">
                    Log in
                  </Link>
                  <Link href="/signup" className="nav-btn nav-btn--light">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden flex items-center gap-2 px-4 pb-3">
            {navLink("/features", "Features")}
            {navLink("/pricing", "Pricing")}
            {navLink("/quizzes", "Quizzes")}
          </div>
        </div>
      </div>
    </header>
  );
}
