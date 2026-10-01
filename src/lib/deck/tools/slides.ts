import { slideTitle } from "../constants";
import { createSlide } from "../defaults";
import { newId } from "../ids";
import { DEFAULT_THEME, getTheme } from "../theme/themes";
import type { Deck, Slide, SlideElement } from "../types";
import type { ToolArgs } from "./schemas";
import { fail, findSlide, insertAt, moveIndex, ok, replaceSlide, slideLabel, type Reducer } from "./shared";

export const addSlide: Reducer<ToolArgs<"add_slide">> = (deck, args) => {
  const slide = createSlide(args);
  const slides = insertAt(deck.slides, args.index, slide);
  const next = { ...deck, slides };
  return ok(next, `Added ${slideLabel(next, slide.id)} — ${slideTitle(slide)}`, { slideId: slide.id });
};

export const updateSlide: Reducer<ToolArgs<"update_slide">> = (deck, args) => {
  if (!findSlide(deck, args.slideId)) return fail(`Slide ${args.slideId} not found`);
  const changed: string[] = [];
  const next = replaceSlide(deck, args.slideId, (slide) => {
    const patch: Partial<Slide> = {};
    if (args.background !== undefined) (patch.background = args.background), changed.push("background");
    if (args.speakerNotes !== undefined) (patch.speakerNotes = args.speakerNotes), changed.push("speaker notes");
    if (args.intent !== undefined) (patch.intent = args.intent), changed.push("intent");
    return { ...slide, ...patch };
  });
  if (changed.length === 0) return fail("update_slide: nothing to change");
  return ok(next, `Updated ${changed.join(", ")} on ${slideLabel(deck, args.slideId)}`, { slideId: args.slideId });
};

export const changeLayout: Reducer<ToolArgs<"change_layout">> = (deck, args) => {
  if (!findSlide(deck, args.slideId)) return fail(`Slide ${args.slideId} not found`);
  const next = replaceSlide(deck, args.slideId, (slide) => ({ ...slide, layout: args.layout }));
  return ok(next, `Set ${slideLabel(deck, args.slideId)} layout to ${args.layout}`, { slideId: args.slideId });
};

export const deleteSlide: Reducer<ToolArgs<"delete_slide">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const next = { ...deck, slides: deck.slides.filter((s) => s.id !== args.slideId) };
  return ok(next, `Deleted slide ${found.index + 1} — ${slideTitle(found.slide)}`);
};

export const reorderSlides: Reducer<ToolArgs<"reorder_slides">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const to = Math.min(args.toIndex, deck.slides.length - 1);
  if (to === found.index) return fail(`Slide ${args.slideId} is already at position ${to + 1}`);
  const next = { ...deck, slides: moveIndex(deck.slides, found.index, to) };
  return ok(next, `Moved slide ${found.index + 1} to position ${to + 1}`, { slideId: args.slideId });
};

export const duplicateSlide: Reducer<ToolArgs<"duplicate_slide">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const copy = cloneSlide(found.slide);
  const next = { ...deck, slides: insertAt(deck.slides, found.index + 1, copy) };
  return ok(next, `Duplicated slide ${found.index + 1} as slide ${found.index + 2}`, { slideId: copy.id });
};

export const setTheme: Reducer<ToolArgs<"set_theme">> = (deck, args) => {
  if (deck.themeId === args.themeId) return fail(`Theme is already ${getTheme(args.themeId).name}`);
  return ok({ ...deck, themeId: args.themeId }, `Switched theme to ${getTheme(args.themeId).name}`);
};

/** Deep copy with fresh ids at every level, so the copy can be edited independently. */
export function cloneSlide(slide: Slide): Slide {
  return { ...slide, id: newId("s"), elements: slide.elements.map(cloneElement) };
}

export function cloneElement(el: SlideElement): SlideElement {
  const id = newId("el");
  switch (el.type) {
    case "table":
      return {
        ...el,
        id,
        columns: el.columns.map((c) => ({ ...c, id: newId("col") })),
        rows: el.rows.map((r) => ({ ...r, id: newId("row"), cells: [...r.cells] })),
      };
    case "chart":
      return {
        ...el,
        id,
        categories: [...el.categories],
        series: el.series.map((s) => ({ ...s, values: [...s.values] })),
      };
    default:
      return { ...el, id, frame: { ...el.frame } };
  }
}

export function emptyDeck(title = ""): Deck {
  return { id: newId("deck"), title, themeId: DEFAULT_THEME.id, aspectRatio: "16:9", slides: [], updatedAt: Date.now() };
}
