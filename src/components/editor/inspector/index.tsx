"use client";

import type { ChartElement, ImageElement, SlideElement, TableElement } from "@/lib/deck/types";
import { ChartInspector } from "./ChartInspector";
import { ImageInspector } from "./ImageInspector";
import { TableInspector } from "./TableInspector";

export type InspectableElement = ChartElement | TableElement | ImageElement;

export function hasInspector(element: SlideElement | null): element is InspectableElement {
  return element?.type === "chart" || element?.type === "table" || element?.type === "image";
}

export function Inspector({ element }: { element: InspectableElement }) {
  return (
    <section aria-label="Inspector" className="flex max-h-60 shrink-0 flex-col border-t border-line bg-panel">
      {element.type === "chart" && <ChartInspector key={element.id} chart={element} />}
      {element.type === "table" && <TableInspector key={element.id} table={element} />}
      {element.type === "image" && <ImageInspector key={element.id} image={element} />}
    </section>
  );
}
