export type { Theme, ThemeColors, ThemeFonts } from "./types";
export { DEFAULT_THEME, THEMES, THEME_IDS, getTheme, type ThemeId } from "./themes";
export {
  resolveFontFamily,
  resolveSeriesColor,
  resolveShapeColors,
  resolveSlideBackground,
  resolveTableStyle,
  resolveTextColor,
  type ResolvedTableStyle,
} from "./resolve";
