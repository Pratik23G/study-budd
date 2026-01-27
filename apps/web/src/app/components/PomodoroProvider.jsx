"use client";

import { createContext, useContext, useMemo } from "react";
import { usePomodoroStore } from "./pomodoroStore";

const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const store = usePomodoroStore();
  const value = useMemo(() => store, [store]);
  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used inside <PomodoroProvider />");
  return ctx;
}
