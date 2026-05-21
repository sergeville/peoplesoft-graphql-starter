import { DEFAULT_THEME_ID, THEME_IDS, THEME_STORAGE_KEY } from "@/lib/theme";

/** Inline script for layout — runs before React to avoid theme flash. */
export function getThemeInitScript(): string {
  const allowed = JSON.stringify([...THEME_IDS]);
  const fallback = JSON.stringify(DEFAULT_THEME_ID);
  const storageKey = JSON.stringify(THEME_STORAGE_KEY);

  return `(function(){try{var k=${storageKey};var a=${allowed};var t=localStorage.getItem(k);if(!t||a.indexOf(t)<0)t=${fallback};document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme",${fallback})}})();`;
}
