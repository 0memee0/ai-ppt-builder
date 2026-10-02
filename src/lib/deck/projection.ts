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

/** Where a chart, table, or image sits right now. Built from elements, not from layout. */
export type ObjectRef = {
  kind: "chart" | "table" | "image";
  elementId: string;
  slideId: string;
  /** 1-based, the number the user says. */
  slide: number;
  title: string;
  /** Set for charts, so "the bar chart" can be matched. */
  chartType?: string;
};

export type DeckProjection = {
  title: string;
  themeId: string;
  slideCount: number;
  /** Charts, tables, and images, in slide order. Rebuilt on every request. */
  objects: ObjectRef[];
  slides: SlideProjection[];
};

export function projectDeck(deck: Deck): DeckProjection {
  const slides = deck.slides.map(projectSlide);
  return {
    title: deck.title,
    themeId: deck.themeId,
    slideCount: deck.slides.length,
    objects: objectIndex(slides),
    slides,
  };
}

/** One line per chart, table, or image. Text is left in the slide body. */
function objectIndex(slides: SlideProjection[]): ObjectRef[] {
  const refs: ObjectRef[] = [];
  for (const slide of slides) {
    for (const el of slide.elements) {
      const title = objectTitle(el, slide.title);
      if (!title) continue;
      refs.push({
        kind: title.kind,
        elementId: el.id,
        slideId: slide.id,
        slide: slide.index,
        title: title.title,
        ...(title.chartType && { chartType: title.chartType }),
      });
    }
  }
  return refs;
}

function objectTitle(el: ElementProjection, slideTitle: string): { kind: ObjectRef["kind"]; title: string; chartType?: string } | null {
  if (el.type === "chart") return { kind: "chart", title: el.chart?.title || slideTitle, chartType: el.chart?.chartType };
  if (el.type === "table") return { kind: "table", title: slideTitle };
  if (el.type === "image") return { kind: "image", title: el.image?.alt || slideTitle };
  return null;
}

/**
 * Plain-text locations for the latest user message. Chat history often names
 * the slide a chart used to be on; this list is rebuilt from elements and is
 * placed after that history so it is the last thing the model reads.
 */
export function formatLocations(deck: Deck): string {
  const objects = projectDeck(deck).objects;
  const lines =
    objects.length === 0
      ? ["- none"]
      : objects.map((o) => {
          const kind = o.chartType ? `${o.chartType} chart` : o.kind;
          return `- ${kind} "${o.title}" is on slide ${o.slide} (element ${o.elementId}).`;
        });
  return `Locations, from the elements right now. Answer "where is the chart / table / image" from this list only. Ignore layout, intent, and any earlier message that names a different slide.\n${lines.join("\n")}`;
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
