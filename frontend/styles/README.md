# Frontend themes

Color themes are easy to change in two places:

1. **`themes.css`** — define CSS variables for each `[data-theme="…"]` block.
2. **`lib/theme.ts`** — add `{ id, label, themeColor }` to the `THEMES` array.

Components use semantic tokens only (`var(--accent)`, `var(--bg)`, etc.), not hard-coded colors.

Built-in themes:

| Theme | Reference image | Polish file |
|-------|-----------------|-------------|
| **Flux** (default) | `public/flux-theme-reference.png` | `flux-ui.css` |
| **HR Dashboard** | `public/hr-dashboard-reference.png` | `hr-dashboard-ui.css` |
| **Crextio** | `public/crextio-reference.png` | `crextio-ui.css` |
| Light, Dark, Ocean, Forest, Violet | — | — |

Users pick a theme from the header dropdown; choice is saved in `localStorage` under `employee-app-theme`.
