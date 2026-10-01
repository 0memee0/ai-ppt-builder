import { withIds, type IdSource } from "../ids";
import type { Deck } from "../types";
import { addChart, changeChartType, updateChartData } from "./charts";
import { addElement, deleteElement, moveElement, reorderElements, resizeElement, updateElement } from "./elements";
import { isToolName, toolSchemas, type ToolArgs, type ToolName } from "./schemas";
import { fail, type Reducer, type ReducerOutcome } from "./shared";
import { addSlide, changeLayout, deleteSlide, duplicateSlide, reorderSlides, setTheme, updateSlide } from "./slides";

export const reducers: { [N in ToolName]: Reducer<ToolArgs<N>> } = {
  add_slide: addSlide,
  update_slide: updateSlide,
  change_layout: changeLayout,
  delete_slide: deleteSlide,
  reorder_slides: reorderSlides,
  duplicate_slide: duplicateSlide,
  set_theme: setTheme,
  add_element: addElement,
  update_element: updateElement,
  delete_element: deleteElement,
  move_element: moveElement,
  resize_element: resizeElement,
  reorder_elements: reorderElements,
  add_chart: addChart,
  update_chart_data: updateChartData,
  change_chart_type: changeChartType,
};

/**
 * Single entry point for every writer: toolbar, drag, and the model.
 * Validates raw args against the tool schema, then runs the reducer.
 * On any failure the input deck is returned untouched by the caller.
 *
 * `ids` overrides id minting for the call; model turns pass a sequential
 * source so the server and the client mirror produce identical ids.
 */
export function applyTool(deck: Deck, name: string, rawArgs: unknown, ids?: IdSource): ReducerOutcome {
  if (!isToolName(name)) return fail(`Unknown tool ${name}`);
  const parsed = toolSchemas[name].safeParse(rawArgs);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ");
    return fail(`Invalid arguments for ${name}: ${issues}`);
  }
  const reducer = reducers[name] as Reducer<unknown>;
  return withIds(ids, () => reducer(deck, parsed.data));
}

/** Typed convenience for UI callers that already hold well-formed args. */
export function runTool<N extends ToolName>(deck: Deck, name: N, args: ToolArgs<N>): ReducerOutcome {
  return applyTool(deck, name, args);
}

export type { ReducerOutcome } from "./shared";
