"use client";

import { useState } from "react";
import { usePomodoro } from "./PomodoroProvider";
import PomodoroSettings from "./pomodoro/PomodoroSettings";

const ChevronIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function PomodoroSidebarCard() {
  const {
    hydrated, studyMinutes, shortBreakMinutes, longBreakMinutes, longBreakEvery,
    mode, modeLabel, isRunning, cycleCount, mm, ss, ringPercent,
    applySettings,
    start, pause, resetTimer, switchMode, pad2,
  } = usePomodoro();

  const [expanded, setExpanded] = useState(false);
  const [showEditTimes, setShowEditTimes] = useState(false);

  const label = hydrated === false ? "..." : modeLabel;

  const accentColor =
    mode === "focus" ? "text-indigo-600 dark:text-indigo-400"
    : mode === "shortBreak" ? "text-emerald-600 dark:text-emerald-400"
    : "text-blue-600 dark:text-blue-400";

  const ringStroke =
    mode === "focus" ? "stroke-indigo-500"
    : mode === "shortBreak" ? "stroke-emerald-500"
    : "stroke-blue-500";

  const accentBg =
    mode === "focus" ? "bg-indigo-50 dark:bg-indigo-950/30"
    : mode === "shortBreak" ? "bg-emerald-50 dark:bg-emerald-950/30"
    : "bg-blue-50 dark:bg-blue-950/30";

  const RADIUS = 22;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, ringPercent)) / 100);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      {/* Always-visible row — stacks vertically on very small screens */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 py-3 sm:px-4 sm:py-3">
        {/* Top row on mobile: ring + label + chevron */}
        <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
          {/* Progress ring — larger on mobile for easy glance */}
          <div className="relative w-16 h-16 sm:w-14 sm:h-14 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r={RADIUS} fill="none" strokeWidth="3.5" className="stroke-slate-100 dark:stroke-slate-700" />
              <circle
                cx="26" cy="26" r={RADIUS} fill="none" strokeWidth="3.5"
                strokeLinecap="round" strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset} className={`${ringStroke} transition-all duration-500`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xs sm:text-[11px] font-bold tabular-nums leading-none ${accentColor}`}>
                {pad2(mm)}:{pad2(ss)}
              </span>
            </div>
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Pomodoro</div>
            <div className="text-sm sm:text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{label}</div>
            <div className={`text-[10px] font-medium mt-0.5 ${accentColor} sm:hidden`}>
              Session {cycleCount}
            </div>
          </div>

          {/* Chevron — always visible */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-lg p-2 sm:p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition"
            aria-label="Toggle options"
            type="button"
          >
            <ChevronIcon className={`w-5 h-5 sm:w-4 sm:h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Action buttons — full width on mobile, inline on desktop */}
        <div className="flex items-center gap-2 sm:gap-2">
          {!isRunning ? (
            <button
              onClick={start}
              className="flex-1 sm:flex-none shrink-0 rounded-lg bg-indigo-600 px-4 sm:px-3 py-2.5 sm:py-1.5 text-sm sm:text-xs font-bold text-white hover:bg-indigo-700 active:bg-indigo-800 transition"
              type="button"
            >
              Start
            </button>
          ) : (
            <button
              onClick={pause}
              className="flex-1 sm:flex-none shrink-0 rounded-lg bg-slate-800 dark:bg-slate-600 px-4 sm:px-3 py-2.5 sm:py-1.5 text-sm sm:text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-500 active:bg-slate-900 transition"
              type="button"
            >
              Pause
            </button>
          )}
          {/* Quick mode pill — visible on mobile */}
          <div className={`sm:hidden rounded-full px-3 py-1.5 text-[11px] font-bold ${accentColor} ${accentBg}`}>
            {label}
          </div>
        </div>
      </div>

      {/* Dropdown panel */}
      {expanded && (
        <PomodoroSettings
          mode={mode}
          switchMode={switchMode}
          cycleCount={cycleCount}
          resetTimer={resetTimer}
          showEditTimes={showEditTimes}
          setShowEditTimes={setShowEditTimes}
          isRunning={isRunning}
          studyMinutes={studyMinutes}
          shortBreakMinutes={shortBreakMinutes}
          longBreakMinutes={longBreakMinutes}
          longBreakEvery={longBreakEvery}
          applySettings={applySettings}
        />
      )}
    </div>
  );
}
