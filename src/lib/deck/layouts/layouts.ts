import type { Frame } from "../types";
import type { LayoutSpec } from "./types";

const f = (x: number, y: number, w: number, h: number): Frame => ({ x, y, w, h, rotation: 0 });

/* Shared bands. Left/right split the body; hero titles sit mid-slide. */
const TITLE = f(120, 72, 1680, 100);
const HERO_TITLE = f(160, 380, 1600, 200);
const BODY = f(120, 220, 1680, 760);
const LEFT = f(120, 220, 800, 760);
const RIGHT = f(1000, 220, 800, 760);

export const LAYOUTS = [
  {
    id: "title",
    name: "Title",
    description: "hero opener",
    hint: 'Hero slide: at most one subtitle text element under the title, centered, role "subtitle". No other content.',
    hero: true,
    regions: { title: HERO_TITLE, subtitle: f(160, 600, 1600, 100) },
  },
  {
    id: "section",
    name: "Section",
    description: "divider",
    hint: "Section divider: optionally one short text element. Keep it sparse.",
    hero: true,
    regions: { title: HERO_TITLE, subtitle: f(160, 600, 1600, 100) },
  },
  {
    id: "content",
    name: "Content",
    description: "title + body",
    hint: "Content slide: one or two body text elements, or one text element plus a table, chart, or image.",
    hero: false,
    regions: { title: TITLE, body: BODY },
  },
  {
    id: "two-column",
    name: "Two columns",
    description: "two equal columns",
    hint: "Two columns: put one text or image element per column using the left and right regions.",
    hero: false,
    regions: { title: TITLE, left: LEFT, right: RIGHT },
  },
  {
    id: "comparison",
    name: "Comparison",
    description: "two labeled options",
    hint: 'Comparison: two columns, each a short label text element (role "subtitle") above a body text element.',
    hero: false,
    regions: {
      title: TITLE,
      leftLabel: f(120, 220, 800, 80),
      left: f(120, 320, 800, 660),
      rightLabel: f(1000, 220, 800, 80),
      right: f(1000, 320, 800, 660),
    },
  },
  {
    id: "chart-forward",
    name: "Chart",
    description: "one chart with a short note",
    hint: "Chart-forward: one add_chart in the chart region with real-looking series, and one short body text element as the takeaway in the note region.",
    hero: false,
    regions: { title: TITLE, chart: f(120, 220, 1120, 760), note: f(1300, 260, 500, 640) },
  },
  {
    id: "blank",
    name: "Blank",
    description: "free placement",
    hint: "Blank layout: place content freely.",
    hero: false,
    regions: { title: TITLE, body: BODY },
  },
] as const satisfies readonly LayoutSpec[];

export type LayoutId = (typeof LAYOUTS)[number]["id"];

export const LAYOUT_IDS = LAYOUTS.map((l) => l.id) as [LayoutId, ...LayoutId[]];

export const DEFAULT_LAYOUT: LayoutSpec = LAYOUTS.find((l) => l.id === "blank") ?? LAYOUTS[0];

export function getLayout(id: string): LayoutSpec {
  return LAYOUTS.find((l) => l.id === id) ?? DEFAULT_LAYOUT;
}

/** For the OUTLINE prompt: `"title" (hero opener), "section" (divider), …`. */
export function describeLayouts(): string {
  return LAYOUTS.map((l) => `"${l.id}" (${l.description})`).join(", ");
}

/** For the POPULATE prompt: the hint plus the named regions with their frames. */
export function describeLayoutRegions(id: string): string {
  const layout = getLayout(id);
  const regions = Object.entries(layout.regions)
    .filter(([name]) => name !== "title")
    .map(([name, r]) => `${name} {x ${r.x}, y ${r.y}, w ${r.w}, h ${r.h}}`)
    .join("; ");
  return regions ? `${layout.hint} Regions: ${regions}.` : layout.hint;
}
