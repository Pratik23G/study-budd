"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function totalSecondsForMode(mode, studyM, shortM, longM) {
  if (mode === "focus") return studyM * 60;
  if (mode === "shortBreak") return shortM * 60;
  return longM * 60;
}

export default function PomodoroTimer() {
  // User settings
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [longBreakEvery, setLongBreakEvery] = useState(4);

  // Timer state
  const [mode, setMode] = useState("focus"); // "focus" | "shortBreak" | "longBreak"
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0); // counts completed focus sessions

  const initialSeconds = useMemo(
    () => totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  );

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // Prevent "Pause" from acting like "Reset"
  const totalForModeRef = useRef(initialSeconds);

  // When user changes durations, update secondsLeft ONLY if:
  // - timer is not running, AND
  // - user hasn't started this session (still at full time)
  useEffect(() => {
    const newTotal = totalSecondsForMode(
      mode,
      studyMinutes,
      shortBreakMinutes,
      longBreakMinutes
    );

    if (!isRunning) {
      const oldTotal = totalForModeRef.current || newTotal;
      const userHasStartedThisSession = secondsLeft !== oldTotal;

      if (!userHasStartedThisSession) {
        setSecondsLeft(newTotal);
      }
    }

    totalForModeRef.current = newTotal;
  }, [mode, studyMinutes, shortBreakMinutes, longBreakMinutes, isRunning, secondsLeft]);

  // Tick
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  // Auto-advance when time hits 0
  useEffect(() => {
    if (secondsLeft !== 0) return;

    // If time ended while running, stop briefly (avoid double triggers)
    // then move to next stage.
    if (isRunning) setIsRunning(false);

    if (mode === "focus") {
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      const isLong = nextCycle % longBreakEvery === 0;
      const nextMode = isLong ? "longBreak" : "shortBreak";
      setMode(nextMode);

      const nextSeconds = totalSecondsForMode(
        nextMode,
        studyMinutes,
        shortBreakMinutes,
        longBreakMinutes
      );
      totalForModeRef.current = nextSeconds;
      setSecondsLeft(nextSeconds);
    } else {
      // break finished -> go back to focus
      setMode("focus");
      const nextSeconds = totalSecondsForMode(
        "focus",
        studyMinutes,
        shortBreakMinutes,
        longBreakMinutes
      );
      totalForModeRef.current = nextSeconds;
      setSecondsLeft(nextSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  const modeLabel =
    mode === "focus"
      ? "Focus"
      : mode === "shortBreak"
      ? "Short Break"
      : "Long Break";

  const ringPercent = useMemo(() => {
    const total = totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
    if (!total) return 0;
    return Math.round(((total - secondsLeft) / total) * 100);
  }, [mode, secondsLeft, studyMinutes, shortBreakMinutes, longBreakMinutes]);

  function start() {
    if (secondsLeft === 0) {
      // If ended, reset to full before starting
      const fresh = totalSecondsForMode(
        mode,
        studyMinutes,
        shortBreakMinutes,
        longBreakMinutes
      );
      totalForModeRef.current = fresh;
      setSecondsLeft(fresh);
    }
    setIsRunning(true);
  }

  function pause() {
    setIsRunning(false); // should freeze time (no reset)
  }

  function resetTimer() {
    setIsRunning(false);
    const fresh = totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
    totalForModeRef.current = fresh;
    setSecondsLeft(fresh);
  }

  function resetAll() {
    setIsRunning(false);
    setCycleCount(0);
    setMode("focus");
    const fresh = totalSecondsForMode("focus", studyMinutes, shortBreakMinutes, longBreakMinutes);
    totalForModeRef.current = fresh;
    setSecondsLeft(fresh);
  }

  function switchMode(nextMode) {
    setIsRunning(false);
    setMode(nextMode);
    const fresh = totalSecondsForMode(
      nextMode,
      studyMinutes,
      shortBreakMinutes,
      longBreakMinutes
    );
    totalForModeRef.current = fresh;
    setSecondsLeft(fresh);
  }

  return (
    <div className="w-full max-w-xl">
      <div className="rounded-2xl bg-white shadow-xl border border-slate-100 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Mode</p>
            <h3 className="text-xl font-bold text-slate-900">{modeLabel}</h3>
            <p className="text-sm text-slate-500 mt-1">
              Completed focus sessions: <span className="font-semibold">{cycleCount}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500">Progress</p>
            <p className="text-lg font-semibold text-slate-900">{ringPercent}%</p>
          </div>
        </div>

        {/* Timer display */}
        <div className="mt-6 flex items-center justify-center">
          <div className="relative w-48 h-48 rounded-full border-8 border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-8 border-indigo-500 opacity-30" />
            <div className="text-center">
              <div className="text-5xl font-extrabold text-slate-900 tabular-nums">
                {pad2(mm)}:{pad2(ss)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {isRunning ? "Running" : "Paused"}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {!isRunning ? (
            <button
              onClick={start}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              Start
            </button>
          ) : (
            <button
              onClick={pause}
              className="rounded-xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800
                focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 font-semibold hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            Reset
          </button>

          <button
            onClick={resetAll}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 font-semibold hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            Reset All
          </button>
        </div>

        {/* Quick mode switches */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => switchMode("focus")}
            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
              mode === "focus"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
              mode === "shortBreak"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
              mode === "longBreak"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Long Break
          </button>
        </div>

        {/* Settings */}
        <div className="mt-7 grid grid-cols-2 gap-4">
          <Setting
            label="Study (min)"
            value={studyMinutes}
            min={1}
            max={180}
            onChange={setStudyMinutes}
            disabled={isRunning}
          />
          <Setting
            label="Short break (min)"
            value={shortBreakMinutes}
            min={1}
            max={60}
            onChange={setShortBreakMinutes}
            disabled={isRunning}
          />
          <Setting
            label="Long break (min)"
            value={longBreakMinutes}
            min={1}
            max={90}
            onChange={setLongBreakMinutes}
            disabled={isRunning}
          />
          <Setting
            label="Long break every"
            value={longBreakEvery}
            min={2}
            max={10}
            onChange={setLongBreakEvery}
            disabled={isRunning}
            suffix="sessions"
          />
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Tip: You can edit durations while paused. Editing is locked while running.
        </p>
      </div>
    </div>
  );
}

function Setting({ label, value, onChange, min, max, disabled, suffix }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {suffix ? <span className="text-xs text-slate-500">{suffix}</span> : null}
      </div>

      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900
          focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
      />
    </div>
  );
}
