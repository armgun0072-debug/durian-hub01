export const THEME_STORAGE_KEY = "durian-hub-theme";
export type ThemePreference = "light" | "dark" | "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

// Runs before the body paints. Storage may be unavailable in private/restricted tabs.
export const themeBootstrap = `(()=>{let theme="system";try{const stored=localStorage.getItem("${THEME_STORAGE_KEY}");if(stored==="light"||stored==="dark"||stored==="system")theme=stored}catch{}const dark=theme==="dark"||(theme==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=dark?"dark":"light";document.documentElement.style.colorScheme=dark?"dark":"light"})()`;
