import type {
  ChartSeries,
  ElementRole,
  ShapeElement,
  Slide,
  TableStyle,
  TextElement,
} from "../types";
import type { Theme } from "./types";

/*
 * Pure resolvers: element value if explicitly set, otherwise the theme's.
 * Every renderer (editor, thumbnail, print) goes through these, so a theme
 * switch is one field change on the deck.
 */

const MUTED_ROLES: ReadonlySet<ElementRole> = new Set(["subtitle", "caption"]);
const HEADING_ROLES: ReadonlySet<ElementRole> = new Set(["title", "subtitle"]);

export function resolveTextColor(el: TextElement, theme: Theme): string {
  if (el.style.color) return el.style.color;
  if (el.role === "accent") return theme.colors.accent;
  return el.role && MUTED_ROLES.has(el.role) ? theme.colors.muted : theme.colors.text;
}

export function resolveFontFamily(el: TextElement, theme: Theme): string {
  if (el.style.fontFamily) return el.style.fontFamily;
  return el.role && HEADING_ROLES.has(el.role) ? theme.fonts.heading : theme.fonts.body;
}

export type ResolvedTableStyle = Required<TableStyle>;

export function resolveTableStyle(style: TableStyle, theme: Theme): ResolvedTableStyle {
  return {
    ...style,
    headerFill: style.headerFill ?? theme.colors.surface,
    textColor: style.textColor ?? theme.colors.text,
    gridColor: style.gridColor ?? theme.colors.grid,
  };
}

export function resolveShapeColors(el: ShapeElement, theme: Theme): { fill: string; stroke: string } {
  const line = el.shape === "line";
  return {
    fill: el.fill ?? (line ? "transparent" : theme.colors.surface),
    stroke: el.stroke ?? (line ? theme.colors.text : "transparent"),
  };
}

export function resolveSlideBackground(slide: Slide, theme: Theme): string {
  return slide.background ?? theme.colors.background;
}

export function resolveSeriesColor(series: ChartSeries | undefined, index: number, theme: Theme): string {
  const { palette } = theme.colors;
  return series?.color ?? palette[index % palette.length];
}
