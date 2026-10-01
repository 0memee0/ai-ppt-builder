import { tool, type FlexibleSchema, type ToolSet } from "ai";
import { sequentialIds, type IdSource } from "@/lib/deck/ids";
import { TOOL_NAMES, modelToolSchemas, type ToolArgs, type ToolName, type ToolResult } from "@/lib/deck/tools/schemas";
import type { Deck } from "@/lib/deck/types";
import { applyWithLimits, type TurnLimits } from "./limits";

/**
 * The 15 deck tools as AI SDK tools. Each `execute` runs the shared reducer
 * against a request-local deck so the model gets real results: minted ids to
 * reference next, and specific errors it can correct on the following step.
 * The client mirrors every streamed call with the same reducer and the same
 * id sequence, so nothing about the deck needs to come back over the wire.
 */

const DESCRIPTIONS: Record<ToolName, string> = {
  add_slide: "Add a slide. Creates the title text element when a title is given. Returns the new slideId.",
  update_slide: "Change a slide's background color, speaker notes, or intent.",
  change_layout: "Change a slide's layout hint. Existing elements keep their frames.",
  delete_slide: "Remove a slide and everything on it.",
  reorder_slides: "Move a slide to a new 0-based position.",
  duplicate_slide: "Copy a slide, placed right after the original. Returns the new slideId.",
  set_theme: "Switch the deck theme (colours and fonts for every slide). Use for whole-deck looks like dark, warm, or light.",
  add_element:
    "Add a text, image, table, or shape element to a slide. Omit frame for a layout default. Returns the new elementId.",
  update_element:
    "Change an element's content, style, or frame. For tables, columns and rows together replace the grid. Use the chart tools for charts.",
  delete_element: "Remove an element from a slide.",
  move_element:
    "Move an element to a new frame on the same slide, or to another slide (appended in front). copy=true leaves the original.",
  resize_element: "Set an element's width and height, optionally its position.",
  reorder_elements: "Change an element's z-order. 0 is the back; the last index is the front.",
  add_chart:
    "Add a bar, line, area, or pie chart. Every series must have one value per category. Returns the new elementId.",
  update_chart_data: "Replace a chart's title, categories, series, or options. Series replace the full list when given.",
  change_chart_type: "Switch a chart between bar, line, area, and pie.",
};

export type ToolSession = {
  /** Deck after every tool executed so far in this request. */
  deck: Deck;
  /** Tool calls in execution order, for logging and the finish summary. */
  calls: { name: ToolName; result: ToolResult }[];
  limits: TurnLimits;
};

export function createToolSession(deck: Deck, limits: TurnLimits = {}): ToolSession {
  return { deck, calls: [], limits };
}

export function createServerTools(session: ToolSession, requestId: string): ToolSet {
  const ids = sequentialIds(requestId);
  const tools: ToolSet = {};
  for (const name of TOOL_NAMES) tools[name] = defineTool(name, session, ids);
  return tools;
}

function defineTool<N extends ToolName>(name: N, session: ToolSession, ids: IdSource) {
  // The registry value is a union of 15 Zod shapes; pin it to this tool's own
  // argument type so `tool()` infers a concrete input.
  const inputSchema = modelToolSchemas[name] as unknown as FlexibleSchema<ToolArgs<N>>;
  return tool({
    description: DESCRIPTIONS[name],
    inputSchema,
    execute: (input: ToolArgs<N>): ToolResult => {
      const out = applyWithLimits(session.deck, name, input, ids, session.limits);
      const result: ToolResult = out.ok ? out.result : { ok: false, error: out.error };
      if (out.ok) session.deck = out.deck;
      session.calls.push({ name, result });
      return result;
    },
  });
}
