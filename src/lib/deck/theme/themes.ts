import type { Theme } from "./types";

const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

/** Registry. Adding a theme here is all it takes; ids flow into the schema and the model prompt. */
export const THEMES = [
  {
    id: "default",
    name: "Paper",
    description: "White slides, near-black text, blue-to-orange chart palette.",
    colors: {
      background: "#ffffff",
      surface: "#f1ede6",
      text: "#161616",
      muted: "#5f5b55",
      accent: "#2454d6",
      accentAlt: "#e07a3d",
      grid: "#e3ded6",
      palette: ["#2454d6", "#3d7a8c", "#e07a3d", "#f0a202", "#1f2933"],
    },
    fonts: { heading: SANS, body: SANS },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark navy slides with light text and bright series colours.",
    colors: {
      background: "#0f1320",
      surface: "#1b2133",
      text: "#f4f1ec",
      muted: "#a9a39a",
      accent: "#7aa2ff",
      accentAlt: "#ffa66b",
      grid: "#2a3147",
      palette: ["#7aa2ff", "#5ecfc0", "#ffa66b", "#ffd166", "#c4b5fd"],
    },
    fonts: { heading: SANS, body: SANS },
  },
  {
    id: "sand",
    name: "Sand",
    description: "Warm cream slides, serif headings, terracotta accents.",
    colors: {
      background: "#f7f1e8",
      surface: "#ece2d1",
      text: "#2b2620",
      muted: "#7a6f63",
      accent: "#b3541e",
      accentAlt: "#2454d6",
      grid: "#dccfbc",
      palette: ["#b3541e", "#2454d6", "#6b8e23", "#c9a227", "#5c4b51"],
    },
    fonts: { heading: SERIF, body: SANS },
  },
] as const satisfies readonly Theme[];

export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_IDS = THEMES.map((t) => t.id) as [ThemeId, ...ThemeId[]];

export const DEFAULT_THEME: Theme = THEMES[0];

/** Unknown ids fall back to the default so an old deck still renders. */
export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}
