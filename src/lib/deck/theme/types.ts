/**
 * A theme is the only place slide colours and fonts are defined. Elements
 * carry no colour unless the user or model explicitly overrides one, so
 * switching `deck.themeId` restyles every slide (PowerPoint's theme-colour
 * vs. explicit-colour model).
 */
export type ThemeColors = {
  /** Slide background. */
  background: string;
  /** Raised panels: table headers, shape fills, image placeholders. */
  surface: string;
  /** Primary text. */
  text: string;
  /** Secondary text: subtitles, captions, chart axes. */
  muted: string;
  /** Emphasis: accent text role, first chart series. */
  accent: string;
  /** Secondary emphasis. */
  accentAlt: string;
  /** Table borders, chart grid lines. */
  grid: string;
  /** Series colours in order; cycles when exhausted. */
  palette: string[];
};

export type ThemeFonts = {
  heading: string;
  body: string;
};

export type Theme = {
  id: string;
  name: string;
  /** Shown in the picker and in the model prompt. */
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
};
