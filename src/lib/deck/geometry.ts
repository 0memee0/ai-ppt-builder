import { ARTBOARD, MIN_ELEMENT_SIZE, SNAP } from "./constants";
import type { Frame } from "./types";

/**
 * Forces a frame inside the artboard. Size is clamped first, then position is
 * shifted so the box stays fully visible. A drop never fails for being too big.
 */
export function clampFrame(frame: Frame): Frame {
  const w = clamp(Math.round(frame.w), MIN_ELEMENT_SIZE, ARTBOARD.w);
  const h = clamp(Math.round(frame.h), MIN_ELEMENT_SIZE, ARTBOARD.h);
  const x = clamp(Math.round(frame.x), 0, ARTBOARD.w - w);
  const y = clamp(Math.round(frame.y), 0, ARTBOARD.h - h);
  return { x, y, w, h, rotation: frame.rotation ?? 0 };
}

/** Fills a partial frame from a fallback, then clamps. Used by every tool that accepts `frame?`. */
export function resolveFrame(partial: Partial<Frame> | undefined, fallback: Frame): Frame {
  return clampFrame({ ...fallback, ...stripUndefined(partial ?? {}) });
}

export function snapToGrid(value: number, step: number = SNAP): number {
  return Math.round(value / step) * step;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
