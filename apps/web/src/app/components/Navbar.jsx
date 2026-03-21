"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import {
  PROFILE_UPDATED_EVENT,
  resolveProfileAvatarUrl,
} from "../../lib/profile";
import NotificationBell from "./NotificationBell";
import { useTheme } from "./ThemeProvider";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /* -------------------- Auth -------------------- */
  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let active = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const nextUser = data?.user ?? null;
      if (!active) return;

      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setAvatarUrl("");
        setLoading(false);
        return;
      }

      const { data: nextProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nextUser.id)
        .maybeSingle();

      if (error) {
        console.warn("Navbar profile load warning:", error);
      }
      if (!active) return;

      setProfile(nextProfile ?? null);

      const pathOrUrl = nextProfile?.avatar_path || nextProfile?.avatar_url || "";
      if (!pathOrUrl) {
        setAvatarUrl("");
        setLoading(false);
        return;
      }

      try {
        setAvatarUrl(await resolveProfileAvatarUrl(supabase, pathOrUrl));
      } catch (avatarErr) {
        console.warn("Navbar avatar load warning:", avatarErr);
        setAvatarUrl("");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUser();
      setMenuOpen(false);
    });

    function handleProfileUpdated() {
      loadUser();
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  /* Close menu on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Close on outside click / ESC */
  useEffect(() => {
    function handleClick(e) {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  /* -------------------- Helpers -------------------- */
  const displayName = useMemo(() => {
    if (profile?.full_name?.trim()) return profile.full_name.trim();
    if (!user?.email) return "Account";
    return user.email.split("@")[0];
  }, [profile, user]);

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh?.();
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const isAuthRoute =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  const isDashboardRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/account");

  /* Close mobile menu on outside click */
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  /* -------------------- Render -------------------- */

  /* Hide global navbar on dashboard/account — those routes have their own nav */
  if (isDashboardRoute) return null;

  return (
    <header className="sticky top-0 z-50 liquid-header">
      <div className="relative mx-auto max-w-7xl px-2 sm:px-6 pt-3">
        <div className="liquid-nav rounded-2xl border border-white/10 overflow-visible">
          <div className="relative flex items-center justify-between px-3 sm:px-4 py-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Image
                src="/S.svg"
                alt="StudyBudd"
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10"
                priority
              />
              <div className="leading-tight">
                <div className="text-white font-bold tracking-tight text-sm sm:text-base">
                  StudyBudd
                </div>
                <div className="text-[10px] sm:text-xs text-white/70 -mt-0.5 hidden sm:block">
                  AI Study Companion
                </div>
              </div>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme toggle */}
              <ThemeToggle />

              {/* Notification bell -- only when logged in */}
              {!loading && user && <NotificationBell />}

              <div ref={menuRef}>
              {loading ? (
                <span className="text-white/70 text-sm px-3">...</span>
              ) : user ? (
                <div className="relative">

                  {/* Account trigger */}
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className={`account-trigger ${
                      menuOpen ? "account-trigger--open" : ""
                    }`}
                    title={user.email ?? "Account menu"}
                  >
                    <span className="account-trigger__avatar inline-flex size-7 shrink-0 overflow-hidden rounded-full">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={displayName || "Account avatar"}
                          className="block size-full object-cover object-center"
                        />
                      ) : (
                        displayName?.[0]?.toUpperCase() ?? "U"
                      )}
                    </span>

                    <span className="account-trigger__name">
                      {displayName}
                    </span>

                    <span
                      className="account-trigger__icon"
                      aria-hidden="true"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M4 7h16M4 12h16M4 17h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                    <div
                      role="menu"
                      className="menu-panel absolute right-0 mt-2 w-56 sm:w-64 z-[9999]"
                    >
                      <div className="px-3 py-2 text-xs text-white/70 border-b border-white/10">
                        Signed in as{" "}
                        <span className="text-white/90">
                          {user.email}
                        </span>
                      </div>

                      <div className="p-2 flex flex-col gap-1">
                        <Link href="/dashboard" className="menu-item">
                          Dashboard
                        </Link>
                        <Link href="/dashboard/files" className="menu-item">
                          Files
                        </Link>
                        <Link href="/dashboard/chat" className="menu-item">
                          Chat
                        </Link>
                        <Link href="/dashboard/quizzes" className="menu-item">
                          Quizzes
                        </Link>

                        <div className="h-px bg-white/10 my-1" />

                        <Link href="/account" className="menu-item">
                          Account
                        </Link>

                        <div className="h-px bg-white/10 my-1" />

                        <button
                          onClick={signOut}
                          className="menu-item menu-item--danger"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  {!isAuthRoute && (
                    <Link
                      href="/login"
                      className="nav-pill nav-pill--ghost text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                    >
                      Log in
                    </Link>
                  )}
                  <Link href="/signup" className="nav-btn nav-btn--light text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">
                    Sign up
                  </Link>
                </div>
              )}
              </div>

              {/* Hamburger — logged-out only, mobile only */}
              {!loading && !user && (
                <div ref={mobileMenuRef} className="relative md:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    className="rounded-xl p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                  >
                    {mobileMenuOpen ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>

                  {mobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 z-[9999] menu-panel rounded-xl border border-white/10 p-2 flex flex-col gap-1">
                      <Link href="/features" className="menu-item">Features</Link>
                      <Link href="/pricing" className="menu-item">Pricing</Link>
                      <Link href="/quizzes" className="menu-item">Quizzes</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
