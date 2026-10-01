import type { Slide } from "./types";

export const ARTBOARD = { w: 1920, h: 1080 } as const;
export const MIN_ELEMENT_SIZE = 32;
export const SNAP = 8;

export function slideTitle(slide: Slide): string {
  const title = slide.elements.find((el) => el.role === "title" && el.type === "text");
  const text = title?.type === "text" ? title.text.trim() : "";
  return text || "Untitled";
}
