"use client";

import { createSupabaseBrowser } from "../supabase/client";

export async function logFocusCompletion({ minutes }) {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return;

  // local day in YYYY-MM-DD (browser locale-safe)
  const localDay = new Date().toLocaleDateString("en-CA");

  // 1) insert raw session
  await supabase.from("pomodoro_sessions").insert({
    user_id: user.id,
    mode: "focus",
    minutes,
    ended_at: new Date().toISOString(),
    local_day: localDay,
  });

  // 2) upsert aggregate
  const { data: existing } = await supabase
    .from("productivity_days")
    .select("focus_sessions, focus_minutes")
    .eq("user_id", user.id)
    .eq("day", localDay)
    .single();

  const nextSessions = (existing?.focus_sessions ?? 0) + 1;
  const nextMinutes = (existing?.focus_minutes ?? 0) + minutes;

  await supabase.from("productivity_days").upsert({
    user_id: user.id,
    day: localDay,
    focus_sessions: nextSessions,
    focus_minutes: nextMinutes,
  });
}
