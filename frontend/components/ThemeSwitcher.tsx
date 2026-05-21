"use client";

import { useTheme } from "@/components/ThemeProvider";
import { isThemeId, THEMES } from "@/lib/theme";

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme();

  return (
    <label className="theme-switcher">
      <span className="theme-switcher__label">Theme</span>
      <select
        className="theme-switcher__select"
        value={themeId}
        onChange={(event) => {
          const next = event.target.value;
          if (isThemeId(next)) setThemeId(next);
        }}
        aria-label="Color theme"
      >
        {THEMES.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  );
}
