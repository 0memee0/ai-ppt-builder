import { z } from "zod";
import {
  chartOptionsSchema,
  chartSeriesSchema,
  chartTypeSchema,
  elementRoleSchema,
  imageFitSchema,
  imageSourceSchema,
  partialFrameSchema,
  shapeKindSchema,
  slideLayoutSchema,
  tableStyleSchema,
  textStyleSchema,
} from "../schema";
import { THEME_IDS } from "../theme/themes";

/**
 * The AI contract. Fifteen tools, each argument shape validated here before a
 * reducer runs. The same schemas feed the AI SDK tool definitions on the server
 * and the client-side check before applying a streamed call.
 *
 * Fields are optional rather than defaulted so the JSON schema sent to the
 * model stays plain; reducers fill defaults.
 */

const id = z.string().min(1);

/* ── Slides ─────────────────────────────────────────────────────────────── */

export const addSlideArgs = z.object({
  index: z.number().int().min(0).optional().describe("Insert position. Omit to append."),
  layout: slideLayoutSchema,
  title: z.string().optional().describe("Creates the title text element."),
  intent: z.string().optional().describe("One line on what this slide should say. Not rendered."),
  speakerNotes: z.string().optional(),
  background: z.string().optional().describe("CSS color."),
});

export const updateSlideArgs = z.object({
  slideId: id,
  background: z.string().optional(),
  speakerNotes: z.string().optional(),
  intent: z.string().optional(),
});

export const changeLayoutArgs = z.object({ slideId: id, layout: slideLayoutSchema });

export const deleteSlideArgs = z.object({ slideId: id });

export const reorderSlidesArgs = z.object({ slideId: id, toIndex: z.number().int().min(0) });

export const duplicateSlideArgs = z.object({ slideId: id });

/* ── Deck ───────────────────────────────────────────────────────────────── */

export const setThemeArgs = z.object({
  themeId: z.enum(THEME_IDS).describe("Restyles every slide. Explicit element colours are kept."),
});

/* ── Elements ───────────────────────────────────────────────────────────── */

const placement = {
  slideId: id,
  frame: partialFrameSchema.optional().describe("Logical 1920×1080 units. Omit for a sensible default."),
  zIndex: z.number().int().min(0).optional().describe("Omit to place in front."),
};

const textVariant = z.object({
  ...placement,
  type: z.literal("text"),
  text: z.string(),
  role: elementRoleSchema.optional(),
  style: textStyleSchema.partial().optional(),
});

const imageVariant = z.object({
  ...placement,
  type: z.literal("image"),
  src: imageSourceSchema,
  alt: z.string().optional(),
  fit: imageFitSchema.optional(),
});

const tableVariant = z.object({
  ...placement,
  type: z.literal("table"),
  columns: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())),
  style: tableStyleSchema.partial().optional(),
});

const shapeVariant = z.object({
  ...placement,
  type: z.literal("shape"),
  shape: shapeKindSchema,
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  radius: z.number().min(0).optional(),
});

export const addElementArgs = z.discriminatedUnion("type", [textVariant, imageVariant, tableVariant, shapeVariant]);

/**
 * Table colours are the theme's business. The model may size and align a
 * table; the inspector (same tool, full schema) is where colours get edited.
 * Zod strips the keys the model is not offered, so a call that still sends
 * them lands as a plain themed table on both the server and the client mirror.
 */
const modelTableStyle = tableStyleSchema.pick({ fontSize: true, align: true }).partial().optional();

export const modelAddElementArgs = z.discriminatedUnion("type", [
  textVariant,
  imageVariant,
  tableVariant.extend({ style: modelTableStyle }),
  shapeVariant,
]);

export const updateElementArgs = z.object({
  slideId: id,
  elementId: id,
  frame: partialFrameSchema.optional(),
  role: elementRoleSchema.optional(),
  // text
  text: z.string().optional(),
  style: textStyleSchema.partial().optional(),
  // image
  src: imageSourceSchema.optional(),
  alt: z.string().optional(),
  fit: imageFitSchema.optional(),
  // table — presence replaces the whole grid
  columns: z.array(z.string()).min(1).optional(),
  rows: z.array(z.array(z.string())).optional(),
  tableStyle: tableStyleSchema.partial().optional(),
  // shape
  shape: shapeKindSchema.optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  radius: z.number().min(0).optional(),
});

export const deleteElementArgs = z.object({ slideId: id, elementId: id });

export const moveElementArgs = z.object({
  elementId: id,
  fromSlideId: id,
  toSlideId: id,
  frame: partialFrameSchema.optional().describe("Omit to keep the frame; it is clamped into the target."),
  copy: z.boolean().optional().describe("true leaves the original in place."),
});

export const resizeElementArgs = z.object({
  slideId: id,
  elementId: id,
  frame: z.object({
    w: z.number().positive(),
    h: z.number().positive(),
    x: z.number().optional(),
    y: z.number().optional(),
  }),
});

export const reorderElementsArgs = z.object({
  slideId: id,
  elementId: id,
  toIndex: z.number().int().min(0).describe("0 is the back."),
});

/* ── Charts ─────────────────────────────────────────────────────────────── */

export const addChartArgs = z.object({
  slideId: id,
  chartType: chartTypeSchema,
  title: z.string().optional(),
  categories: z.array(z.string()).min(1),
  series: z.array(chartSeriesSchema).min(1),
  frame: partialFrameSchema.optional(),
  options: chartOptionsSchema.partial().optional(),
});

export const updateChartDataArgs = z.object({
  slideId: id,
  elementId: id,
  title: z.string().optional(),
  categories: z.array(z.string()).min(1).optional(),
  series: z.array(chartSeriesSchema).min(1).optional().describe("Replaces the full series list when present."),
  options: chartOptionsSchema.partial().optional(),
});

export const changeChartTypeArgs = z.object({ slideId: id, elementId: id, chartType: chartTypeSchema });

/* ── Registry ───────────────────────────────────────────────────────────── */

export const toolSchemas = {
  add_slide: addSlideArgs,
  update_slide: updateSlideArgs,
  change_layout: changeLayoutArgs,
  delete_slide: deleteSlideArgs,
  reorder_slides: reorderSlidesArgs,
  duplicate_slide: duplicateSlideArgs,
  set_theme: setThemeArgs,
  add_element: addElementArgs,
  update_element: updateElementArgs,
  delete_element: deleteElementArgs,
  move_element: moveElementArgs,
  resize_element: resizeElementArgs,
  reorder_elements: reorderElementsArgs,
  add_chart: addChartArgs,
  update_chart_data: updateChartDataArgs,
  change_chart_type: changeChartTypeArgs,
} as const;

/** What the model is offered. A subset of `toolSchemas`, so anything it parses also passes the full schema. */
export const modelToolSchemas: { readonly [N in ToolName]: z.ZodType<ToolArgs<N>> } = {
  ...toolSchemas,
  add_element: modelAddElementArgs,
  update_element: updateElementArgs.extend({ tableStyle: modelTableStyle }),
};

export type ToolName = keyof typeof toolSchemas;

export type ToolArgs<N extends ToolName = ToolName> = z.infer<(typeof toolSchemas)[N]>;

export const TOOL_NAMES = Object.keys(toolSchemas) as ToolName[];

/** Which tools each generation phase exposes. Refine gets everything. */
export const PHASE_TOOLS = {
  plan: ["add_slide"],
  populate: ["add_element", "add_chart", "update_element", "resize_element", "reorder_elements"],
  refine: TOOL_NAMES,
} as const satisfies Record<string, readonly ToolName[]>;

export type Phase = keyof typeof PHASE_TOOLS;

export function isToolName(name: string): name is ToolName {
  return name in toolSchemas;
}

/** Result shape every tool returns, on the server and in the client mirror. */
export type ToolResult =
  | { ok: true; summary: string; slideId?: string; elementId?: string }
  | { ok: false; error: string };
