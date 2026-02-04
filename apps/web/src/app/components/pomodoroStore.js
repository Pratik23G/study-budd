"use client";

import { useEffect, useRef, useState } from "react";
import { logFocusCompletion } from "../../lib/pomodoro/logFocusCompletion"; //  correct path from /components

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
  const persisted = loadInitial();

  const [studyMinutes, setStudyMinutes] = useState(persisted?.studyMinutes ?? 25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(
    persisted?.shortBreakMinutes ?? 5
  );
  const [longBreakMinutes, setLongBreakMinutes] = useState(
    persisted?.longBreakMinutes ?? 15
  );
  const [longBreakEvery, setLongBreakEvery] = useState(persisted?.longBreakEvery ?? 4);

  const [mode, setMode] = useState(persisted?.mode ?? "focus");
  const [isRunning, setIsRunning] = useState(persisted?.isRunning ?? false);
  const [cycleCount, setCycleCount] = useState(persisted?.cycleCount ?? 0);

  const [secondsLeft, setSecondsLeft] = useState(() => {
    const now = Date.now();
    const targetEnd = persisted?.targetEndMs ?? null;

    if (persisted?.isRunning && targetEnd) {
      return Math.max(0, Math.floor((targetEnd - now) / 1000));
    }

    if (typeof persisted?.secondsLeft === "number") return persisted.secondsLeft;

    // use persisted defaults to avoid relying on runtime state here
    const initMode = persisted?.mode ?? "focus";
    const initStudy = persisted?.studyMinutes ?? 25;
    const initShort = persisted?.shortBreakMinutes ?? 5;
    const initLong = persisted?.longBreakMinutes ?? 15;

    return totalSecondsForMode(initMode, initStudy, initShort, initLong);
  });

  const targetEndMsRef = useRef(persisted?.targetEndMs ?? null);

  // Persist
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

  // Keep secondsLeft in sync when paused and editing durations
  useEffect(() => {
    const newTotal = totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes);
    if (!isRunning) {
      const atFullTime = secondsLeft === newTotal || secondsLeft > newTotal;
      if (atFullTime) setSecondsLeft(newTotal);
      targetEndMsRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, studyMinutes, shortBreakMinutes, longBreakMinutes]);

  // Tick using targetEndMs so route changes don't matter
  useEffect(() => {
    if (!isRunning) return;

    if (!targetEndMsRef.current) {
      targetEndMsRef.current = Date.now() + secondsLeft * 1000;
    }

    const id = setInterval(() => {
      const remaining = Math.max(0, Math.floor((targetEndMsRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 250);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]); // intentionally only isRunning

  // Auto advance when hit 0
  useEffect(() => {
    if (secondsLeft !== 0) return;

    if (isRunning) setIsRunning(false);
    targetEndMsRef.current = null;

    if (mode === "focus") {
      // ✅ LOG HERE (only when a focus session actually finishes)
      logFocusCompletion({ minutes: studyMinutes }).catch(() => {});

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
      setSecondsLeft(nextSeconds);
    } else {
      setMode("focus");
      const nextSeconds = totalSecondsForMode(
        "focus",
        studyMinutes,
        shortBreakMinutes,
        longBreakMinutes
      );
      setSecondsLeft(nextSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Actions
  function start() {
    const fresh =
      secondsLeft === 0
        ? totalSecondsForMode(mode, studyMinutes, shortBreakMinutes, longBreakMinutes)
        : secondsLeft;

    if (secondsLeft === 0) setSecondsLeft(fresh);

    setIsRunning(true);
    targetEndMsRef.current = Date.now() + fresh * 1000; // ✅ use fresh, not stale secondsLeft
  }

  function pause() {
    setIsRunning(false);
    targetEndMsRef.current = null;
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

    setStudyMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    setLongBreakEvery,

    start,
    pause,
    resetTimer,
    resetAll,
    switchMode,
    pad2,
  };
}
