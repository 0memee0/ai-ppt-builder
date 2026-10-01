import type { Deck, Slide, SlideElement } from "../types";
import type { ToolResult } from "./schemas";

/**
 * Outcome of one reducer. On success the caller gets the next deck plus the
 * result to hand back to the model / chat. On failure the deck is untouched.
 */
export type ReducerOutcome =
  | { ok: true; deck: Deck; result: Extract<ToolResult, { ok: true }> }
  | { ok: false; error: string };

export type Reducer<A> = (deck: Deck, args: A) => ReducerOutcome;

export function fail(error: string): ReducerOutcome {
  return { ok: false, error };
}

export function ok(deck: Deck, summary: string, ids: { slideId?: string; elementId?: string } = {}): ReducerOutcome {
  return { ok: true, deck: { ...deck, updatedAt: Date.now() }, result: { ok: true, summary, ...ids } };
}

export function findSlide(deck: Deck, slideId: string): { slide: Slide; index: number } | undefined {
  const index = deck.slides.findIndex((s) => s.id === slideId);
  return index === -1 ? undefined : { slide: deck.slides[index], index };
}

export function findElement(slide: Slide, elementId: string): { element: SlideElement; index: number } | undefined {
  const index = slide.elements.findIndex((el) => el.id === elementId);
  return index === -1 ? undefined : { element: slide.elements[index], index };
}

/** Replaces one slide by id; every other slide keeps its object identity. */
export function replaceSlide(deck: Deck, slideId: string, update: (slide: Slide) => Slide): Deck {
  return { ...deck, slides: deck.slides.map((s) => (s.id === slideId ? update(s) : s)) };
}

export function replaceElement(slide: Slide, elementId: string, update: (el: SlideElement) => SlideElement): Slide {
  return { ...slide, elements: slide.elements.map((el) => (el.id === elementId ? update(el) : el)) };
}

export function insertAt<T>(list: readonly T[], index: number | undefined, item: T): T[] {
  const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), item, ...list.slice(at)];
}

export function moveIndex<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
}

/** Human label for chat summaries: "slide 3". */
export function slideLabel(deck: Deck, slideId: string): string {
  const found = findSlide(deck, slideId);
  return found ? `slide ${found.index + 1}` : `slide ${slideId}`;
}

/** Human label for chat summaries: the chart “Revenue by quarter”. */
export function describeElement(el: SlideElement): string {
  switch (el.type) {
    case "text": {
      const preview = el.text.trim().split("\n")[0].slice(0, 40);
      return `the ${el.role ?? "text"} “${preview}${el.text.length > 40 ? "…" : ""}”`;
    }
    case "chart":
      return el.title ? `the ${el.chartType} chart “${el.title}”` : `the ${el.chartType} chart`;
    case "table":
      return `the table (${el.columns.length}×${el.rows.length})`;
    case "image":
      return el.alt ? `the image “${el.alt}”` : "the image";
    case "shape":
      return `the ${el.shape}`;
  }
}
