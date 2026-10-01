import {
  createImageElement,
  createShapeElement,
  createTableElement,
  createTextElement,
  DEFAULT_FRAMES,
  normalizeTextStyle,
  stackBelow,
} from "../defaults";
import { clampFrame, resolveFrame } from "../geometry";
import { newId } from "../ids";
import type { SlideElement, TableElement } from "../types";
import type { ToolArgs } from "./schemas";
import {
  describeElement,
  fail,
  findElement,
  findSlide,
  insertAt,
  moveIndex,
  ok,
  replaceElement,
  replaceSlide,
  slideLabel,
  type Reducer,
} from "./shared";
import { cloneElement } from "./slides";

export const addElement: Reducer<ToolArgs<"add_element">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);

  // Titles own their layout region; everything else without a y stacks under what is there.
  const frame =
    args.type === "text" && args.role === "title" ? args.frame : stackBelow(found.slide, args.frame, DEFAULT_FRAMES[args.type]);

  let element: SlideElement;
  switch (args.type) {
    case "text":
      element = createTextElement({
        text: args.text,
        role: args.role,
        style: args.style,
        frame,
        layout: found.slide.layout,
      });
      break;
    case "image":
      element = createImageElement({ src: args.src, alt: args.alt, fit: args.fit, frame });
      break;
    case "table": {
      const badRow = args.rows.findIndex((r) => r.length !== args.columns.length);
      if (badRow !== -1) return fail(`Row ${badRow + 1} has ${args.rows[badRow].length} cells but there are ${args.columns.length} columns`);
      element = createTableElement({ columns: args.columns, rows: args.rows, style: args.style, frame });
      break;
    }
    case "shape":
      element = createShapeElement({
        shape: args.shape,
        fill: args.fill,
        stroke: args.stroke,
        strokeWidth: args.strokeWidth,
        radius: args.radius,
        frame,
      });
      break;
  }

  const next = replaceSlide(deck, args.slideId, (slide) => ({
    ...slide,
    elements: insertAt(slide.elements, args.zIndex, element),
  }));
  return ok(next, `Added ${describeElement(element)} to ${slideLabel(deck, args.slideId)}`, {
    slideId: args.slideId,
    elementId: element.id,
  });
};

/** Fields `update_element` accepts, by element type. Anything else is a type mismatch. */
const COMMON_FIELDS = ["slideId", "elementId", "frame", "role"] as const;
const TYPE_FIELDS: Record<SlideElement["type"], readonly string[]> = {
  text: ["text", "style"],
  image: ["src", "alt", "fit"],
  table: ["columns", "rows", "tableStyle"],
  shape: ["shape", "fill", "stroke", "strokeWidth", "radius"],
  chart: [],
};

export const updateElement: Reducer<ToolArgs<"update_element">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const target = findElement(found.slide, args.elementId);
  if (!target) return fail(`Element ${args.elementId} is not on ${slideLabel(deck, args.slideId)}`);
  const el = target.element;

  const present = Object.keys(args).filter((k) => args[k as keyof typeof args] !== undefined);
  const allowed = new Set<string>([...COMMON_FIELDS, ...TYPE_FIELDS[el.type]]);
  const wrong = present.filter((k) => !allowed.has(k));
  if (wrong.length) {
    const hint = el.type === "chart" ? " Use update_chart_data or change_chart_type for chart content." : "";
    return fail(`Field${wrong.length > 1 ? "s" : ""} ${wrong.join(", ")} do not apply to a ${el.type} element.${hint}`);
  }
  if (present.length <= 2) return fail("update_element: nothing to change");
  if (el.locked && args.frame) return fail(`${describeElement(el)} is locked and cannot be moved or resized`);

  let updated: SlideElement;
  const frame = args.frame ? resolveFrame(args.frame, el.frame) : el.frame;
  const role = args.role ?? el.role;

  switch (el.type) {
    case "text":
      updated = { ...el, frame, role, text: args.text ?? el.text, style: normalizeTextStyle({ ...el.style, ...args.style }) };
      break;
    case "image":
      updated = { ...el, frame, role, src: args.src ?? el.src, alt: args.alt ?? el.alt, fit: args.fit ?? el.fit };
      break;
    case "table": {
      const grid = rebuildGrid(el, args.columns, args.rows);
      if (typeof grid === "string") return fail(grid);
      updated = { ...el, frame, role, ...grid, style: { ...el.style, ...args.tableStyle } };
      break;
    }
    case "shape":
      updated = {
        ...el,
        frame,
        role,
        shape: args.shape ?? el.shape,
        fill: args.fill ?? el.fill,
        stroke: args.stroke ?? el.stroke,
        strokeWidth: args.strokeWidth ?? el.strokeWidth,
        radius: args.radius ?? el.radius,
      };
      break;
    case "chart":
      updated = { ...el, frame, role };
      break;
  }

  const changed = present.filter((k) => k !== "slideId" && k !== "elementId");
  const next = replaceSlide(deck, args.slideId, (slide) => replaceElement(slide, args.elementId, () => updated));
  return ok(next, `Updated ${changed.join(", ")} on ${describeElement(el)}`, { slideId: args.slideId, elementId: el.id });
};

/** New columns get fresh ids; existing ids are kept by position so undo diffs stay small. */
function rebuildGrid(
  table: TableElement,
  columns: string[] | undefined,
  rows: string[][] | undefined,
): Pick<TableElement, "columns" | "rows"> | string {
  const nextColumns = columns
    ? columns.map((header, i) => ({ id: table.columns[i]?.id ?? newId("col"), header }))
    : table.columns;
  const nextRows = rows ? rows.map((cells, i) => ({ id: table.rows[i]?.id ?? newId("row"), cells })) : table.rows;
  const bad = nextRows.findIndex((r) => r.cells.length !== nextColumns.length);
  if (bad !== -1) return `Row ${bad + 1} has ${nextRows[bad].cells.length} cells but there are ${nextColumns.length} columns`;
  return { columns: nextColumns, rows: nextRows };
}

export const deleteElement: Reducer<ToolArgs<"delete_element">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const target = findElement(found.slide, args.elementId);
  if (!target) return fail(`Element ${args.elementId} is not on ${slideLabel(deck, args.slideId)}`);
  if (target.element.locked) return fail(`${describeElement(target.element)} is locked`);

  const next = replaceSlide(deck, args.slideId, (slide) => ({
    ...slide,
    elements: slide.elements.filter((el) => el.id !== args.elementId),
  }));
  return ok(next, `Deleted ${describeElement(target.element)} from ${slideLabel(deck, args.slideId)}`, { slideId: args.slideId });
};

export const moveElement: Reducer<ToolArgs<"move_element">> = (deck, args) => {
  const from = findSlide(deck, args.fromSlideId);
  if (!from) return fail(`Slide ${args.fromSlideId} not found`);
  const to = findSlide(deck, args.toSlideId);
  if (!to) return fail(`Slide ${args.toSlideId} not found`);
  const target = findElement(from.slide, args.elementId);
  if (!target) return fail(`Element ${args.elementId} is not on ${slideLabel(deck, args.fromSlideId)}`);
  if (target.element.locked) return fail(`${describeElement(target.element)} is locked`);

  const frame = resolveFrame(args.frame, target.element.frame);
  const copy = args.copy === true;
  const moved: SlideElement = copy ? { ...cloneElement(target.element), frame } : { ...target.element, frame };

  let next = deck;
  if (from.index === to.index && !copy) {
    next = replaceSlide(deck, from.slide.id, (slide) => replaceElement(slide, args.elementId, () => moved));
  } else {
    next = {
      ...deck,
      slides: deck.slides.map((slide) => {
        if (slide.id === to.slide.id && slide.id === from.slide.id) return { ...slide, elements: [...slide.elements, moved] };
        if (slide.id === to.slide.id) return { ...slide, elements: [...slide.elements, moved] };
        if (slide.id === from.slide.id && !copy) return { ...slide, elements: slide.elements.filter((el) => el.id !== args.elementId) };
        return slide;
      }),
    };
  }

  const verb = copy ? "Copied" : "Moved";
  const summary =
    from.index === to.index
      ? `${verb} ${describeElement(target.element)} to (${frame.x}, ${frame.y}) on slide ${to.index + 1}`
      : `${verb} ${describeElement(target.element)} from slide ${from.index + 1} to slide ${to.index + 1}`;
  return ok(next, summary, { slideId: to.slide.id, elementId: moved.id });
};

export const resizeElement: Reducer<ToolArgs<"resize_element">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const target = findElement(found.slide, args.elementId);
  if (!target) return fail(`Element ${args.elementId} is not on ${slideLabel(deck, args.slideId)}`);
  if (target.element.locked) return fail(`${describeElement(target.element)} is locked`);

  const frame = clampFrame({ ...target.element.frame, ...args.frame });
  const next = replaceSlide(deck, args.slideId, (slide) =>
    replaceElement(slide, args.elementId, (el) => ({ ...el, frame }) as SlideElement),
  );
  return ok(next, `Resized ${describeElement(target.element)} to ${frame.w}×${frame.h}`, {
    slideId: args.slideId,
    elementId: args.elementId,
  });
};

export const reorderElements: Reducer<ToolArgs<"reorder_elements">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const target = findElement(found.slide, args.elementId);
  if (!target) return fail(`Element ${args.elementId} is not on ${slideLabel(deck, args.slideId)}`);
  if (target.element.locked) return fail(`${describeElement(target.element)} is locked`);

  const to = Math.min(args.toIndex, found.slide.elements.length - 1);
  if (to === target.index) return fail(`${describeElement(target.element)} is already at z-index ${to}`);
  const next = replaceSlide(deck, args.slideId, (slide) => ({
    ...slide,
    elements: moveIndex(slide.elements, target.index, to),
  }));
  const direction = to > target.index ? "forward" : "backward";
  return ok(next, `Sent ${describeElement(target.element)} ${direction} to z-index ${to}`, {
    slideId: args.slideId,
    elementId: args.elementId,
  });
};
