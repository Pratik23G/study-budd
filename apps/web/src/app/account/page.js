"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import AvatarUploader from "../components/AvatarUploader";
import ProductivityHeatmap from "../components/ProductivityHeatmap";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function load() {
      setLoading(true);
      setNotice("");

      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error);

      const u = data?.user ?? null;
      setUser(u);

      if (!u) {
        // not logged in
        router.push("/auth");
        return;
      }

      // Load profile
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .single();

      if (profErr) {
        // If profile row doesn't exist yet, that's okay; we'll create on save
        console.warn("Profile load warning:", profErr.message);
      }

      setFullName(profile?.full_name ?? "");
      setLoading(false);
    }

    load();

    // keep in sync if auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub?.subscription?.unsubscribe();
  }, [router]);

  async function saveChanges() {
    if (!user) return;

    const supabase = createSupabaseBrowser();
    setSaving(true);
    setNotice("");

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setNotice("Saved ✅");
    } catch (e) {
      console.error(e);
      setNotice("Save failed. Check console.");
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(""), 2500);
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
  }

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
          <div className="grid gap-6 sm:grid-cols-[220px_1fr] items-start">
            {/* ✅ REAL AVATAR UPLOADER */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <AvatarUploader />
              <p className="mt-3 text-xs text-white/50">
                Avatar stored in Supabase Storage (avatars bucket).
              </p>
            </div>

            {/* Profile form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/80">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-slate-950/40 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                  placeholder="Pratik Gurung"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={saveChanges}
                  disabled={loading || saving}
                  className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-600 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  onClick={signOut}
                  className="rounded-xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15 transition"
                >
                  Sign out
                </button>

                {notice ? (
                  <span className="text-sm text-white/80">{notice}</span>
                ) : null}
              </div>

              <p className="text-xs text-white/50">
                Profile data in Supabase (profiles table).
              </p>
            </div>
          </div>
        </div>

        {/* ✅ GitHub-style productivity section */}
        <div className="mt-6">
          <ProductivityHeatmap />
        </div>
      </div>
    </main>
  );
}
