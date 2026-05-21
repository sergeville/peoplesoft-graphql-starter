/**
 * Theme registry — add an entry here when you add a block in styles/themes.css.
 */
export const THEME_STORAGE_KEY = "employee-app-theme";

export type ThemeId =
  | "flux"
  | "hr-dashboard"
  | "crextio"
  | "light"
  | "dark"
  | "ocean"
  | "forest"
  | "violet";

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  /** Browser chrome / PWA status bar */
  themeColor: string;
  /** Header brand line (optional override) */
  brand?: string;
  /** Logo mark letters (empty = styled shape in CSS) */
  mark?: string;
};

export const DEFAULT_THEME_ID: ThemeId = "flux";

export const THEMES: readonly ThemeDefinition[] = [
  { id: "flux", label: "Flux", themeColor: "#121212", brand: "Flux", mark: "" },
  {
    id: "hr-dashboard",
    label: "HR Dashboard",
    themeColor: "#2563eb",
    brand: "Employee Summary",
    mark: "HR",
  },
  {
    id: "crextio",
    label: "Crextio",
    themeColor: "#f9f9f4",
    brand: "Crextio",
    mark: "Cx",
  },
  { id: "light", label: "Light", themeColor: "#1d4ed8" },
  { id: "dark", label: "Dark", themeColor: "#0b1220" },
  { id: "ocean", label: "Ocean", themeColor: "#0891b2" },
  { id: "forest", label: "Forest", themeColor: "#15803d" },
  { id: "violet", label: "Violet", themeColor: "#312e81" },
] as const;

/** All valid theme ids (for init script + validation). */
export const THEME_IDS: readonly ThemeId[] = THEMES.map((t) => t.id);

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function getThemeDefinition(id: ThemeId): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function getThemeBrand(id: ThemeId): { brand: string; mark: string } {
  const theme = getThemeDefinition(id);
  return {
    brand: theme.brand ?? "Employee Directory",
    mark: theme.mark ?? "HR",
  };
}
