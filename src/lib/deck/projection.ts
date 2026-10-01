import { slideTitle } from "./constants";
import type { Deck, Slide, SlideElement } from "./types";

/**
 * The deck as the model sees it. Ids, order, frames, and content, without
 * styling noise. This is the only place model context is built, so a later
 * summarizer for long decks plugs in here.
 */

const TEXT_CAP = 2000;

export type ElementProjection = {
  id: string;
  type: SlideElement["type"];
  role?: string;
  /** 0 is the back. */
  z: number;
  frame: { x: number; y: number; w: number; h: number };
  locked?: true;
  text?: string;
  image?: { alt: string; source: "url" | "asset" | "placeholder" };
  chart?: { chartType: string; title: string; categories: string[]; series: { name: string; values: number[] }[] };
  table?: { columns: string[]; rows: string[][] };
  shape?: string;
};

export type SlideProjection = {
  id: string;
  /** 1-based, matches how the user talks about slides. */
  index: number;
  layout: string;
  title: string;
  intent?: string;
  speakerNotes?: string;
  background?: string;
  elements: ElementProjection[];
};

export type DeckProjection = {
  title: string;
  themeId: string;
  slideCount: number;
  slides: SlideProjection[];
};

export function projectDeck(deck: Deck): DeckProjection {
  return {
    title: deck.title,
    themeId: deck.themeId,
    slideCount: deck.slides.length,
    slides: deck.slides.map(projectSlide),
  };
}

export function projectSlide(slide: Slide, index: number): SlideProjection {
  return {
    id: slide.id,
    index: index + 1,
    layout: slide.layout,
    title: slideTitle(slide),
    ...(slide.intent && { intent: slide.intent }),
    ...(slide.speakerNotes && { speakerNotes: slide.speakerNotes }),
    ...(slide.background && { background: slide.background }),
    elements: slide.elements.map(projectElement),
  };
}

export function projectElement(el: SlideElement, z: number): ElementProjection {
  const base: ElementProjection = {
    id: el.id,
    type: el.type,
    ...(el.role && { role: el.role }),
    z,
    frame: { x: el.frame.x, y: el.frame.y, w: el.frame.w, h: el.frame.h },
    ...(el.locked && { locked: true as const }),
  };

  switch (el.type) {
    case "text":
      return { ...base, text: el.text.length > TEXT_CAP ? `${el.text.slice(0, TEXT_CAP)}…` : el.text };
    case "image":
      return { ...base, image: { alt: el.alt, source: el.src.kind } };
    case "chart":
      return {
        ...base,
        chart: {
          chartType: el.chartType,
          title: el.title,
          categories: el.categories,
          series: el.series.map((s) => ({ name: s.name, values: s.values })),
        },
      };
    case "table":
      return { ...base, table: { columns: el.columns.map((c) => c.header), rows: el.rows.map((r) => r.cells) } };
    case "shape":
      return { ...base, shape: el.shape };
  }
}

/** Compact JSON for the system prompt. */
export function serializeProjection(deck: Deck): string {
  return JSON.stringify(projectDeck(deck));
}
