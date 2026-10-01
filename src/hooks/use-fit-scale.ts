"use client";

import { ARTBOARD } from "@/lib/deck/constants";
import { useElementSize } from "./use-element-size";

/**
 * Measures a container and returns the largest 16:9 artboard width that fits
 * inside it with the given padding, plus the scale from logical to CSS px.
 */
export function useFitScale<T extends HTMLElement>(padding: number) {
  const [ref, size] = useElementSize<T>();
  const width = Math.max(
    0,
    Math.min(size.width - padding * 2, ((size.height - padding * 2) * ARTBOARD.w) / ARTBOARD.h),
  );
  const height = width * (ARTBOARD.h / ARTBOARD.w);
  const scale = width / ARTBOARD.w;
  return { ref, width, height, scale };
}
