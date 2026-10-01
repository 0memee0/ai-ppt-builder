import { ARTBOARD } from "./constants";
import type { Frame } from "./types";

export type Guide = { axis: "x" | "y"; at: number };

export type SnapResult = { dx: number; dy: number; guides: Guide[] };

/**
 * Snaps a proposed move so an edge or centre of the moving selection lines up
 * with an edge or centre of another element or of the artboard. One
 * correction per axis, the closest within `threshold` logical units.
 */
export function snapMove(moving: Frame[], dx: number, dy: number, others: Frame[], threshold: number): SnapResult {
  if (moving.length === 0) return { dx, dy, guides: [] };
  const box = bounds(moving);
  const xs = lines(others, "x");
  const ys = lines(others, "y");

  const x = closest([box.x + dx, box.x + box.w / 2 + dx, box.x + box.w + dx], xs, threshold);
  const y = closest([box.y + dy, box.y + box.h / 2 + dy, box.y + box.h + dy], ys, threshold);

  const guides: Guide[] = [];
  if (x) guides.push({ axis: "x", at: x.to });
  if (y) guides.push({ axis: "y", at: y.to });
  return { dx: dx + (x?.delta ?? 0), dy: dy + (y?.delta ?? 0), guides };
}

function bounds(frames: Frame[]): { x: number; y: number; w: number; h: number } {
  const x = Math.min(...frames.map((f) => f.x));
  const y = Math.min(...frames.map((f) => f.y));
  const right = Math.max(...frames.map((f) => f.x + f.w));
  const bottom = Math.max(...frames.map((f) => f.y + f.h));
  return { x, y, w: right - x, h: bottom - y };
}

/** Edges and centres on one axis, including the artboard's own. */
function lines(frames: Frame[], axis: "x" | "y"): number[] {
  const size = axis === "x" ? ARTBOARD.w : ARTBOARD.h;
  const out = [0, size / 2, size];
  for (const f of frames) {
    const start = axis === "x" ? f.x : f.y;
    const extent = axis === "x" ? f.w : f.h;
    out.push(start, start + extent / 2, start + extent);
  }
  return out;
}

function closest(edges: number[], targets: number[], threshold: number): { delta: number; to: number } | null {
  let best: { delta: number; to: number } | null = null;
  for (const edge of edges) {
    for (const to of targets) {
      const delta = to - edge;
      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, to };
    }
  }
  return best;
}
