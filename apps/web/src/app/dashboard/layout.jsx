"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FolderOpen, MessageSquare, Brain, Layers, LayoutDashboard, Menu, X } from "lucide-react";
import { StudyAIPanelProvider, useStudyAIPanel } from "../components/StudyAIPanelProvider";
import StudyAIPanel from "../../components/StudyAIPanel";
import PomodoroSidebarCard from "../components/PomodoroSidebarCard";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/files", label: "Files", icon: FolderOpen },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/quizzes", label: "Quizzes", icon: Brain },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: Layers },
];

export default function DashboardLayout({ children }) {
  return (
    <StudyAIPanelProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </StudyAIPanelProvider>
  );
}

function DashboardLayoutInner({ children }) {
  const { isOpen, togglePanel } = useStudyAIPanel();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-300/30 dark:bg-indigo-900/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-blue-300/30 dark:bg-blue-900/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-300/20 dark:bg-purple-900/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-none px-3 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6">
        <div className="flex gap-4 min-w-0 min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-8rem)]">

          {/* ── Left Sidebar (desktop: always visible, mobile: overlay drawer) ── */}

          {/* Mobile overlay backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar panel */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-50 w-64 flex flex-col
              bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl border-r border-slate-200 dark:border-slate-700
              transform transition-transform duration-300 ease-in-out
              lg:sticky lg:top-24 lg:self-start lg:z-auto lg:w-56 xl:w-60 lg:translate-x-0
              lg:max-h-[calc(100vh-8rem)] lg:h-fit
              lg:rounded-2xl lg:border lg:shadow-xl lg:bg-white/80 lg:dark:bg-slate-800/80
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            {/* Mobile close button */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition"
                type="button"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links — compact, no flex-grow */}
            <nav className="px-3 py-3 lg:pt-4 space-y-1 overflow-y-auto shrink-0">
              {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition
                      ${active
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Pomodoro card pinned to bottom of sidebar */}
            <div className="px-3 pb-3 lg:pb-4 mt-auto shrink-0">
              <PomodoroSidebarCard />
            </div>
          </aside>

          {/* ── Main content area ── */}
          <section className="min-w-0 flex-1 flex flex-col rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-3 sm:p-6 transition-all duration-300">
            {/* Mobile hamburger bar */}
            <div className="flex items-center gap-2 mb-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition"
                type="button"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {NAV_LINKS.find(l => l.exact ? pathname === l.href : pathname?.startsWith(l.href))?.label || "Dashboard"}
              </span>
            </div>

            <div className="w-full max-w-none flex-1 min-h-0 overflow-y-auto">
              {children}
            </div>
          </section>

          {/* AI Side Panel — inline, resizes content */}
          <StudyAIPanel />
        </div>
      </div>

      {/* FAB toggle — visible when panel is closed */}
      {!isOpen && (
        <button
          onClick={togglePanel}
          title="Ask AI"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 pl-3 pr-4 py-2.5 sm:pl-4 sm:pr-5 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-white text-xs sm:text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          Ask AI
        </button>
      )}
    </div>
  );
}
