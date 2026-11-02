"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeSwitcher({ language = "TH" }: { language?: "TH" | "EN" }) {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: language === "TH" ? "โหมดสว่าง" : "Light mode", Icon: Sun },
    { value: "dark", label: language === "TH" ? "โหมดมืด" : "Dark mode", Icon: Moon },
    { value: "system", label: language === "TH" ? "ตามระบบ" : "System theme", Icon: Monitor },
  ] as const;
  return (
    <div role="group" aria-label={language === "TH" ? "รูปแบบการแสดงผล" : "Appearance"} className="theme-switcher">
      {options.map(({ value, label, Icon }) => (
        <button key={value} type="button" title={label} aria-label={label} aria-pressed={theme === value} onClick={() => setTheme(value)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
