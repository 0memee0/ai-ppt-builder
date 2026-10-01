/** All frames live in a logical 1920×1080 space, origin top-left. */
export type Frame = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
};

/** Key into the layout registry (lib/deck/layouts). */
export type SlideLayout = import("./layouts/layouts").LayoutId;

export type ElementRole = "title" | "subtitle" | "body" | "caption" | "accent";

type ElementBase = {
  id: string;
  frame: Frame;
  locked: boolean;
  role?: ElementRole;
};

/*
 * Colour and font fields across elements are optional: absent means "from
 * the deck theme" (see lib/deck/theme). A value is an explicit override.
 */

export type TextStyle = {
  fontFamily?: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  color?: string;
  align: "left" | "center" | "right";
  lineHeight: number;
};

export type TextElement = ElementBase & {
  type: "text";
  text: string;
  style: TextStyle;
};

export type ImageSource =
  | { kind: "url"; url: string }
  | { kind: "asset"; assetId: string }
  | { kind: "placeholder"; label: string };

export type ImageElement = ElementBase & {
  type: "image";
  src: ImageSource;
  alt: string;
  fit: "cover" | "contain";
};

export type ChartType = "bar" | "line" | "pie" | "area";

export type ChartSeries = {
  name: string;
  /** Aligned to `categories` by index. */
  values: number[];
  color?: string;
};

export type ChartOptions = {
  showLegend: boolean;
  showGrid: boolean;
  stacked: boolean;
  valuePrefix: string;
  valueSuffix: string;
};

export type ChartElement = ElementBase & {
  type: "chart";
  chartType: ChartType;
  title: string;
  categories: string[];
  series: ChartSeries[];
  options: ChartOptions;
};

export type TableStyle = {
  fontSize: number;
  headerFill?: string;
  textColor?: string;
  gridColor?: string;
  align: "left" | "center" | "right";
};

export type TableElement = ElementBase & {
  type: "table";
  columns: { id: string; header: string }[];
  /** `cells.length === columns.length` */
  rows: { id: string; cells: string[] }[];
  style: TableStyle;
};

export type ShapeElement = ElementBase & {
  type: "shape";
  shape: "rect" | "ellipse" | "line";
  fill?: string;
  stroke?: string;
  strokeWidth: number;
  radius: number;
};

export type SlideElement =
  | TextElement
  | ImageElement
  | ChartElement
  | TableElement
  | ShapeElement;

export type ElementType = SlideElement["type"];

export type Slide = {
  id: string;
  layout: SlideLayout;
  /** Hint for the populate step. Not rendered. */
  intent: string;
  /** Explicit override; the theme background otherwise. */
  background?: string;
  speakerNotes: string;
  /** Array order is z-order; index 0 is at the back. */
  elements: SlideElement[];
};

export type Deck = {
  id: string;
  title: string;
  /** Key into the theme registry (lib/deck/theme). */
  themeId: string;
  aspectRatio: "16:9";
  slides: Slide[];
  updatedAt: number;
};
