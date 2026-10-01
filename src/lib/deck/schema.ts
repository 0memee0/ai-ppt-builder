import { z } from "zod";
import { ARTBOARD } from "./constants";
import { LAYOUT_IDS } from "./layouts/layouts";
import { DEFAULT_THEME } from "./theme/themes";

/**
 * Runtime schema for the stored deck. Mirrors `types.ts`; TypeScript types there
 * stay the source of truth for the app, this is what validates data coming
 * from IndexedDB, the model, or a file.
 */

export const frameSchema = z.object({
  x: z.number().min(0).max(ARTBOARD.w),
  y: z.number().min(0).max(ARTBOARD.h),
  w: z.number().positive().max(ARTBOARD.w),
  h: z.number().positive().max(ARTBOARD.h),
  rotation: z.number().default(0),
});

/**
 * What the model or a tool may pass: every field optional and unbounded.
 * Reducers run `clampFrame`, so an oversize or off-board request still lands
 * inside the artboard instead of being rejected.
 */
export const partialFrameSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  w: z.number().positive().optional(),
  h: z.number().positive().optional(),
  rotation: z.number().optional(),
});

export const slideLayoutSchema = z.enum(LAYOUT_IDS);

export const elementRoleSchema = z.enum(["title", "subtitle", "body", "caption", "accent"]);

const elementBase = {
  id: z.string().min(1),
  frame: frameSchema,
  locked: z.boolean().default(false),
  role: elementRoleSchema.optional(),
};

export const textStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive(),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]),
  color: z.string().optional(),
  align: z.enum(["left", "center", "right"]),
  lineHeight: z.number().positive(),
});

export const textElementSchema = z.object({
  ...elementBase,
  type: z.literal("text"),
  text: z.string(),
  style: textStyleSchema,
});

export const imageSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("url"), url: z.string().url() }),
  z.object({ kind: z.literal("asset"), assetId: z.string().min(1) }),
  z.object({ kind: z.literal("placeholder"), label: z.string() }),
]);

export const imageFitSchema = z.enum(["cover", "contain"]);

export const imageElementSchema = z.object({
  ...elementBase,
  type: z.literal("image"),
  src: imageSourceSchema,
  alt: z.string(),
  fit: imageFitSchema,
});

export const chartTypeSchema = z.enum(["bar", "line", "pie", "area"]);

export const chartSeriesSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.number()),
  color: z.string().optional(),
});

export const chartOptionsSchema = z.object({
  showLegend: z.boolean(),
  showGrid: z.boolean(),
  stacked: z.boolean(),
  valuePrefix: z.string(),
  valueSuffix: z.string(),
});

export const chartElementSchema = z
  .object({
    ...elementBase,
    type: z.literal("chart"),
    chartType: chartTypeSchema,
    title: z.string(),
    categories: z.array(z.string()).min(1),
    series: z.array(chartSeriesSchema).min(1),
    options: chartOptionsSchema,
  })
  .refine((c) => c.series.every((s) => s.values.length === c.categories.length), {
    message: "Every series must have one value per category",
    path: ["series"],
  });

export const tableStyleSchema = z.object({
  fontSize: z.number().positive(),
  headerFill: z.string().optional(),
  textColor: z.string().optional(),
  gridColor: z.string().optional(),
  align: z.enum(["left", "center", "right"]),
});

export const tableElementSchema = z
  .object({
    ...elementBase,
    type: z.literal("table"),
    columns: z.array(z.object({ id: z.string().min(1), header: z.string() })).min(1),
    rows: z.array(z.object({ id: z.string().min(1), cells: z.array(z.string()) })),
    style: tableStyleSchema,
  })
  .refine((t) => t.rows.every((r) => r.cells.length === t.columns.length), {
    message: "Every row must have one cell per column",
    path: ["rows"],
  });

export const shapeKindSchema = z.enum(["rect", "ellipse", "line"]);

export const shapeElementSchema = z.object({
  ...elementBase,
  type: z.literal("shape"),
  shape: shapeKindSchema,
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0),
  radius: z.number().min(0),
});

export const slideElementSchema = z.union([
  textElementSchema,
  imageElementSchema,
  chartElementSchema,
  tableElementSchema,
  shapeElementSchema,
]);

export const slideSchema = z.object({
  id: z.string().min(1),
  layout: slideLayoutSchema,
  intent: z.string().default(""),
  background: z.string().optional(),
  speakerNotes: z.string().default(""),
  elements: z.array(slideElementSchema),
});

export const deckSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  themeId: z.string().default(DEFAULT_THEME.id),
  aspectRatio: z.literal("16:9"),
  slides: z.array(slideSchema),
  updatedAt: z.number(),
});

export type DeckInput = z.input<typeof deckSchema>;
