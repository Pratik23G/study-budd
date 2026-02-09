"use client";

import { useState, useMemo } from "react";
import { usePomodoro } from "./PomodoroProvider";

export default function PomodoroSidebarCard() {
  const {
    studyMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    longBreakEvery,
    mode,
    modeLabel,
    isRunning,
    cycleCount,
    mm,
    ss,
    ringPercent,

    setStudyMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    setLongBreakEvery,

    start,
    pause,
    resetTimer,
    switchMode,
    pad2,
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);

  // Ring math
  const radius = 46;
  const stroke = 8;

  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  const dashOffset = useMemo(() => {
    const pct = Math.min(100, Math.max(0, ringPercent));
    return circumference * (1 - pct / 100);
  }, [circumference, ringPercent]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">POMODORO</div>
            <div className="mt-1 font-extrabold text-slate-900">{modeLabel}</div>
            <div className="text-xs text-slate-500 mt-1">
              Focus sessions:{" "}
              <span className="font-semibold text-slate-700">{cycleCount}</span>
            </div>
          </div>

          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-xs font-bold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle pomodoro settings"
          >
            {showSettings ? "Hide" : "Settings"}
          </button>
        </div>

        {/* Ring + Actions */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Progress Ring */}
          <div className="relative w-[120px] h-[120px] shrink-0 self-center sm:self-auto">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 120 120"
              aria-label="Pomodoro progress ring"
            >
              {/* track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth={stroke}
                className="stroke-slate-200"
              />
              {/* soft glow behind progress */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth={stroke}
                className="stroke-indigo-500/20"
              />
              {/* progress */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="stroke-indigo-500"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold tabular-nums text-slate-900">
                {pad2(mm)}:{pad2(ss)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                {isRunning ? "Running" : "Paused"} • {ringPercent}%
              </div>
            </div>
          </div>

          {/* Buttons + modes */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2">
              {!isRunning ? (
                <button
                  onClick={start}
                  className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-white font-bold hover:bg-indigo-700"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-white font-bold hover:bg-slate-800"
                >
                  Pause
                </button>
              )}

              <button
                onClick={resetTimer}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-800 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            {/* Mode pills */}
            <div className="mt-3 grid grid-cols-3 gap-2 w-full min-w-0">
              <ModePill active={mode === "focus"} onClick={() => switchMode("focus")}>
                Focus
              </ModePill>
              <ModePill
                active={mode === "shortBreak"}
                onClick={() => switchMode("shortBreak")}
              >
                Short Break
              </ModePill>
              <ModePill active={mode === "longBreak"} onClick={() => switchMode("longBreak")}>
                Long Break
              </ModePill>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible settings */}
      {showSettings ? (
        <div className="px-4 pb-4 border-t border-slate-200 bg-white">
          <div className="pt-4 grid grid-cols-2 gap-3">
            <MiniSetting
              label="Study"
              suffix="min"
              value={studyMinutes}
              min={1}
              max={180}
              disabled={isRunning}
              onChange={setStudyMinutes}
            />
            <MiniSetting
              label="Short"
              suffix="min"
              value={shortBreakMinutes}
              min={1}
              max={60}
              disabled={isRunning}
              onChange={setShortBreakMinutes}
            />
            <MiniSetting
              label="Long"
              suffix="min"
              value={longBreakMinutes}
              min={1}
              max={90}
              disabled={isRunning}
              onChange={setLongBreakMinutes}
            />
            <MiniSetting
              label="Every"
              suffix="sessions"
              value={longBreakEvery}
              min={2}
              max={10}
              disabled={isRunning}
              onChange={setLongBreakEvery}
            />
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Tip: Settings lock while running.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ModePill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full min-w-0",
        "rounded-xl border transition",
        "px-2 py-2",
        "text-[11px] font-extrabold",
        "whitespace-nowrap overflow-hidden text-ellipsis",
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
      title={typeof children === "string" ? children : undefined}
      type="button"
    >
      {children}
    </button>
  );
}

function MiniSetting({ label, suffix, value, onChange, min, max, disabled }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-800">{label}</div>
        <div className="text-[11px] text-slate-500">{suffix}</div>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900
          focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
      />
    </div>
  );
}
