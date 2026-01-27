"use client";

import { useEffect, useRef, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function totalSecondsForMode(mode, studyM, shortM, longM) {
  if (mode === "focus") return studyM * 60;
  if (mode === "shortBreak") return shortM * 60;
  return longM * 60;
}

const STORAGE_KEY = "studybudd_pomodoro_v1";

function loadInitial() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function usePomodoroStore() {
  // Load persisted state if available
  const persisted = loadInitial();

  const [studyMinutes, setStudyMinutes] = useState(persisted?.studyMinutes ?? 25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(persisted?.shortBreakMinutes ?? 5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(persisted?.longBreakMinutes ?? 15);
  const [longBreakEvery, setLongBreakEvery] = useState(persisted?.longBreakEvery ?? 4);

  const [mode, setMode] = useState(persisted?.mode ?? "focus");
  const [isRunning, setIsRunning] = useState(persisted?.isRunning ?? false);
  const [cycleCount, setCycleCount] = useState(persisted?.cycleCount ?? 0);

  const [secondsLeft, setSecondsLeft] = useState(() => {
    // If we saved a “target end timestamp”, compute remaining accurately
    const now = Date.now();
    const targetEnd = persisted?.targetEndMs ?? null;

    if (persisted?.isRunning && targetEnd) {
      return Math.max(0, Math.floor((targetEnd - now) / 1000));
    }

    // fallback: use saved secondsLeft or full time
    if (typeof persisted?.secondsLeft === "number") return persisted.secondsLeft;

    return totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
  });

  // This is the key: store the absolute end time when running
  const targetEndMsRef = useRef(persisted?.targetEndMs ?? null);

  // Persist on any important change
  useEffect(() => {
    saveState({
      studyMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      longBreakEvery,
      mode,
      isRunning,
      cycleCount,
      secondsLeft,
      targetEndMs: targetEndMsRef.current,
    });
  }, [
    studyMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    longBreakEvery,
    mode,
    isRunning,
    cycleCount,
    secondsLeft,
  ]);

  // When user changes durations while paused AND hasn’t started session, keep in sync
  useEffect(() => {
    const newTotal = totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
    if (!isRunning) {
      // If at full time, update
      const atFullTime = secondsLeft === newTotal || secondsLeft > newTotal; // safe
      if (atFullTime) setSecondsLeft(newTotal);
      targetEndMsRef.current = null;
    }
  }, [mode, studyMinutes, shortBreakMinutes, longBreakMinutes]); // intentionally omit isRunning/secondsLeft

  // Tick using targetEndMs so route changes don't matter
  useEffect(() => {
    if (!isRunning) return;

    // If we don't have a target end time (fresh start), create it
    if (!targetEndMsRef.current) {
      targetEndMsRef.current = Date.now() + secondsLeft * 1000;
    }

    const id = setInterval(() => {
      const remaining = Math.max(0, Math.floor((targetEndMsRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 250); // smoother & more accurate than 1000ms

    return () => clearInterval(id);
  }, [isRunning]);

  // Auto advance when hit 0
  useEffect(() => {
    if (secondsLeft !== 0) return;

    if (isRunning) setIsRunning(false);
    targetEndMsRef.current = null;

    if (mode === "focus") {
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      const isLong = nextCycle % longBreakEvery === 0;
      const nextMode = isLong ? "longBreak" : "shortBreak";
      setMode(nextMode);

      const nextSeconds = totalSecondsForMode(nextMode, studyMinutes, shortBreakMinutes, longBreakMinutes);
      setSecondsLeft(nextSeconds);
    } else {
      setMode("focus");
      const nextSeconds = totalSecondsForMode("focus", studyMinutes, shortBreakMinutes, longBreakMinutes);
      setSecondsLeft(nextSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Actions
  function start() {
    if (secondsLeft === 0) {
      const fresh = totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
      setSecondsLeft(fresh);
    }
    setIsRunning(true);
    targetEndMsRef.current = Date.now() + secondsLeft * 1000;
  }

  function pause() {
    setIsRunning(false);
    targetEndMsRef.current = null; // stop absolute clock; secondsLeft stays frozen
  }

  function resetTimer() {
    setIsRunning(false);
    targetEndMsRef.current = null;
    const fresh = totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
    setSecondsLeft(fresh);
  }

  function resetAll() {
    setIsRunning(false);
    targetEndMsRef.current = null;
    setCycleCount(0);
    setMode("focus");
    const fresh = totalSecondsForMode("focus", studyMinutes, shortBreakMinutes, longBreakMinutes);
    setSecondsLeft(fresh);
  }

  function switchMode(nextMode) {
    setIsRunning(false);
    targetEndMsRef.current = null;
    setMode(nextMode);
    const fresh = totalSecondsForMode(nextMode, studyMinutes, shortBreakMinutes, longBreakMinutes);
    setSecondsLeft(fresh);
  }

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  const modeLabel =
    mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break";

  const ringPercent = (() => {
    const total = totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
    if (!total) return 0;
    return Math.round(((total - secondsLeft) / total) * 100);
  })();

  return {
    // state
    studyMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    longBreakEvery,
    mode,
    modeLabel,
    isRunning,
    cycleCount,
    secondsLeft,
    mm,
    ss,
    ringPercent,

    // setters
    setStudyMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    setLongBreakEvery,

    // actions
    start,
    pause,
    resetTimer,
    resetAll,
    switchMode,
    pad2,
  };
}
