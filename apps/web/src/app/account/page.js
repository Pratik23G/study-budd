"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import { getMyProfile, updateMyProfile } from "../../lib/profile";

function getPublicAvatarUrl(supabase, path) {
  if (!path) return "";
  // If you store a full URL, return as-is
  if (path.startsWith("http")) return path;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl ?? "";
}

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Account
          </h1>
          <p className="text-white/70 mt-1">
            Manage your profile and account settings.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] p-6 sm:p-8">
          {/* Put your existing account UI inside this card */}
          {/* Example placeholder */}
          <div className="grid gap-6 sm:grid-cols-[160px_1fr] items-start">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 grid place-items-center text-2xl font-black">
                PG
              </div>
              <button className="mt-4 w-full rounded-xl bg-white text-slate-900 font-semibold py-2 hover:bg-white/90 transition">
                Upload avatar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/80">
                  Full name
                </label>
                <input
                  className="mt-2 w-full rounded-xl bg-slate-950/40 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Pratik Gurung"
                />
              </div>

              <div className="flex gap-3">
                <button className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-600 transition">
                  Save changes
                </button>
                <button className="rounded-xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15 transition">
                  Sign out
                </button>
              </div>

              <p className="text-xs text-white/50">
                Profile data in Supabase (profiles table). Avatar stored in Storage (avatars bucket).
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
