import { clampFrame } from "./geometry";
import { newId } from "./ids";
import { DEFAULT_LAYOUT, getLayout } from "./layouts/layouts";
import type {
  ChartElement,
  ChartOptions,
  ElementRole,
  Frame,
  ImageElement,
  ImageSource,
  ShapeElement,
  Slide,
  SlideLayout,
  TableElement,
  TableStyle,
  TextElement,
  TextStyle,
} from "./types";

/*
 * Default frames, in logical 1920×1080 units. Used when a tool or the toolbar
 * omits a frame. See the "Defaults when a frame is omitted" table in the schema pass.
 *
 * No colours are set here. Factories leave colour fields undefined so the
 * deck theme decides at render time; only explicit user/model values land.
 */

const f = (x: number, y: number, w: number, h: number): Frame => ({ x, y, w, h, rotation: 0 });

export const DEFAULT_FRAMES = {
  text: f(120, 220, 1680, 160),
  image: f(120, 220, 800, 450),
  chart: f(120, 200, 1680, 720),
  table: f(120, 220, 1680, 480),
  shape: f(160, 200, 320, 200),
} as const satisfies Record<string, Frame>;

/** Title position comes from the layout registry. */
export function titleFrameFor(layout: SlideLayout): Frame {
  return getLayout(layout).regions.title;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 28,
  fontWeight: 400,
  align: "left",
  lineHeight: 1.4,
};

/** Size and weight per role. Colour per role lives in the theme resolver. */
export const ROLE_STYLES: Record<ElementRole, Partial<TextStyle>> = {
  title: { fontSize: 48, fontWeight: 600, lineHeight: 1.15 },
  subtitle: { fontSize: 32, fontWeight: 500, lineHeight: 1.3 },
  body: {},
  caption: { fontSize: 20 },
  accent: { fontSize: 28, fontWeight: 600 },
};

const HERO_TITLE_STYLE: Partial<TextStyle> = { fontSize: 72, fontWeight: 700, align: "center", lineHeight: 1.1 };

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  showLegend: true,
  showGrid: true,
  stacked: false,
  valuePrefix: "",
  valueSuffix: "",
};

export const DEFAULT_TABLE_STYLE: TableStyle = {
  fontSize: 26,
  align: "left",
};

/* Element factories. Every id is minted here; callers never pass one. */

type TextInit = {
  text: string;
  frame?: Partial<Frame>;
  role?: ElementRole;
  style?: Partial<TextStyle>;
  layout?: SlideLayout;
};

export function createTextElement(init: TextInit): TextElement {
  const role = init.role ?? "body";
  const isHeroTitle = role === "title" && init.layout !== undefined && getLayout(init.layout).hero;
  const fallback = role === "title" ? titleFrameFor(init.layout ?? "content") : DEFAULT_FRAMES.text;
  const style = normalizeTextStyle({
    ...DEFAULT_TEXT_STYLE,
    ...ROLE_STYLES[role],
    ...(isHeroTitle ? HERO_TITLE_STYLE : {}),
    ...init.style,
  });
  const frame = clampFrame({ ...fallback, ...init.frame });
  return {
    id: newId("el"),
    type: "text",
    text: init.text,
    // Never hand back a box the text visibly overflows; the model's h is a floor, not a cap.
    frame: clampFrame({ ...frame, h: Math.max(frame.h, estimateTextHeight(init.text, frame.w, style)) }),
    locked: false,
    role,
    style,
  };
}

/**
 * `lineHeight` is a multiplier (1.4), but models regularly send a pixel value
 * (52). Anything above 4 cannot be a multiplier, so read it as pixels and
 * convert; otherwise that one field pushes every line off the slide.
 */
export function normalizeTextStyle(style: TextStyle): TextStyle {
  if (style.lineHeight <= 4) return style;
  return { ...style, lineHeight: Math.round((style.lineHeight / style.fontSize) * 100) / 100 };
}

/**
 * Rough height a text block needs, from wrapped line count. Assumes an average
 * glyph is half the font size wide, which is close for the system sans at
 * these sizes. Err on the generous side: a box slightly too tall is invisible,
 * one too short clips or overlaps the element below.
 */
export function estimateTextHeight(text: string, width: number, style: TextStyle): number {
  const charsPerLine = Math.max(1, Math.floor(width / (style.fontSize * 0.5)));
  const lines = text.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  return Math.ceil(lines * style.fontSize * style.lineHeight) + 8;
}

/** Body content lives between these when a slide has nothing below its title. */
const BODY_TOP = DEFAULT_FRAMES.text.y;
const BODY_BOTTOM = 1000;
const STACK_GAP = 32;
/** Below this, shrinking to fit is worse than letting the clamp shift the element. */
const MIN_STACK_HEIGHT = 200;

/**
 * Positions an element the caller did not place vertically: just under the
 * lowest element already on the slide, shrunk to the room left in the body
 * when the type's default height would not fit. Titles keep their own
 * region. This is what keeps two un-positioned body blocks from landing on
 * top of each other.
 */
export function stackBelow(slide: Slide, frame: Partial<Frame> | undefined, fallback: Frame): Partial<Frame> {
  if (frame?.y !== undefined) return frame;
  const bottom = slide.elements.reduce((max, el) => Math.max(max, el.frame.y + el.frame.h), 0);
  const y = Math.max(BODY_TOP, bottom + STACK_GAP);
  const room = BODY_BOTTOM - y;
  const h = frame?.h ?? (room >= MIN_STACK_HEIGHT ? Math.min(fallback.h, room) : fallback.h);
  return { ...frame, y, h };
}

type ImageInit = { src: ImageSource; alt?: string; fit?: ImageElement["fit"]; frame?: Partial<Frame> };

export function createImageElement(init: ImageInit): ImageElement {
  const alt = init.alt ?? (init.src.kind === "placeholder" ? init.src.label : "");
  return {
    id: newId("el"),
    type: "image",
    src: init.src,
    alt,
    fit: init.fit ?? "cover",
    frame: clampFrame({ ...DEFAULT_FRAMES.image, ...init.frame }),
    locked: false,
  };
}

type ChartInit = {
  chartType: ChartElement["chartType"];
  title?: string;
  categories: string[];
  series: ChartElement["series"];
  frame?: Partial<Frame>;
  options?: Partial<ChartOptions>;
};

export function createChartElement(init: ChartInit): ChartElement {
  return {
    id: newId("el"),
    type: "chart",
    chartType: init.chartType,
    title: init.title ?? "",
    categories: init.categories,
    series: init.series,
    options: { ...DEFAULT_CHART_OPTIONS, ...init.options },
    frame: clampFrame({ ...DEFAULT_FRAMES.chart, ...init.frame }),
    locked: false,
  };
}

type TableInit = { columns: string[]; rows: string[][]; frame?: Partial<Frame>; style?: Partial<TableStyle> };

export function createTableElement(init: TableInit): TableElement {
  return {
    id: newId("el"),
    type: "table",
    columns: init.columns.map((header) => ({ id: newId("col"), header })),
    rows: init.rows.map((cells) => ({ id: newId("row"), cells })),
    style: { ...DEFAULT_TABLE_STYLE, ...init.style },
    frame: clampFrame({ ...DEFAULT_FRAMES.table, ...init.frame }),
    locked: false,
  };
}

type ShapeInit = {
  shape: ShapeElement["shape"];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  frame?: Partial<Frame>;
};

export function createShapeElement(init: ShapeInit): ShapeElement {
  return {
    id: newId("el"),
    type: "shape",
    shape: init.shape,
    fill: init.fill,
    stroke: init.stroke,
    strokeWidth: init.strokeWidth ?? (init.shape === "line" ? 4 : 0),
    radius: init.radius ?? 8,
    frame: clampFrame({ ...DEFAULT_FRAMES.shape, ...init.frame }),
    locked: false,
  };
}

type SlideInit = {
  layout?: SlideLayout;
  title?: string;
  intent?: string;
  background?: string;
  speakerNotes?: string;
};

/** A slide with, at most, a title element. `blank` never gets a title unless one is passed. */
export function createSlide(init: SlideInit = {}): Slide {
  const layout = init.layout ?? (DEFAULT_LAYOUT.id as SlideLayout);
  const elements = init.title ? [createTextElement({ text: init.title, role: "title", layout })] : [];
  return {
    id: newId("s"),
    layout,
    intent: init.intent ?? "",
    background: init.background,
    speakerNotes: init.speakerNotes ?? "",
    elements,
  };
}
