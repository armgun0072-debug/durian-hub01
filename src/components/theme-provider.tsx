"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isThemePreference, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const ThemeContext = createContext<{ theme: ThemePreference; setTheme: (theme: ThemePreference) => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setPreference] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemePreference(saved)) setPreference(saved);
    } catch { /* The theme still works for this tab when storage is blocked. */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) setPreference(isThemePreference(event.newValue) ? event.newValue : "system");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, ready]);

  const setTheme = (next: ThemePreference) => {
    setPreference(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* Keep in-memory preference. */ }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
