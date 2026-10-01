"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDeckStore } from "@/store/deck-store";

const DRAG_THRESHOLD = 4;

export type SlideReorderState = {
  draggingSlideId: string;
  fromIndex: number;
  /** Gap the pointer is over, 0..slides.length. */
  insertionIndex: number;
  /** Where the dragged slide lands once removed from its old position. */
  toIndex: number;
  /** Fixed-position box for the floating copy of the thumbnail. */
  ghost: { top: number; left: number; width: number; height: number };
  /** Distance one row moves to open or close a gap. */
  slot: number;
};

type Row = { top: number; mid: number };

/**
 * Drag a filmstrip thumbnail to a new position. A copy of the thumbnail
 * follows the pointer; the other rows slide to open a gap where it will land.
 * Row positions are measured once at drag start, so the shifting rows cannot
 * move the target under the pointer. Release commits one `reorder_slides`
 * call, Escape cancels. A press without movement stays a click.
 */
export function useSlideReorder(enabled: boolean) {
  const [state, setState] = useState<SlideReorderState | null>(null);
  const stateRef = useRef<SlideReorderState | null>(null);
  const press = useRef<{ slideId: string; index: number; startY: number; grabY: number; rows: Row[]; box: DOMRect; slot: number } | null>(null);
  const detach = useRef<() => void>(() => {});

  const show = (s: SlideReorderState | null) => {
    stateRef.current = s;
    setState(s);
  };

  const end = useCallback(() => {
    detach.current();
    detach.current = () => {};
    press.current = null;
    show(null);
  }, []);

  useEffect(() => end, [end]);

  const onThumbnailPointerDown = useCallback(
    (e: React.PointerEvent, slideId: string, index: number) => {
      if (!enabled || e.button !== 0) return;
      const rows = measureRows();
      const row = (e.currentTarget as HTMLElement).closest("li");
      if (!row || rows.length < 2) return;
      const box = row.getBoundingClientRect();
      const slot = rows.length > 1 ? rows[1].top - rows[0].top : box.height;
      press.current = { slideId, index, startY: e.clientY, grabY: e.clientY - box.top, rows, box, slot };

      const onMove = (ev: PointerEvent) => {
        const p = press.current;
        if (!p) return;
        if (!stateRef.current && Math.abs(ev.clientY - p.startY) < DRAG_THRESHOLD) return;
        const insertionIndex = insertionIndexAt(ev.clientY, p.rows);
        show({
          draggingSlideId: p.slideId,
          fromIndex: p.index,
          insertionIndex,
          // Removing the dragged slide shifts everything after it up by one.
          toIndex: insertionIndex > p.index ? insertionIndex - 1 : insertionIndex,
          ghost: { top: ev.clientY - p.grabY, left: p.box.left, width: p.box.width, height: p.box.height },
          slot: p.slot,
        });
      };
      const onUp = () => {
        const p = press.current;
        const s = stateRef.current;
        if (p && s && s.toIndex !== p.index) {
          useDeckStore.getState().run("reorder_slides", { slideId: p.slideId, toIndex: s.toIndex });
        }
        end();
      };
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") end();
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", end);
      window.addEventListener("keydown", onKey);
      detach.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", end);
        window.removeEventListener("keydown", onKey);
      };
    },
    [enabled, end],
  );

  return { reorder: state, onThumbnailPointerDown };
}

function measureRows(): Row[] {
  return [...document.querySelectorAll<HTMLElement>("[data-slide-id]")].map((thumb) => {
    const r = (thumb.closest("li") ?? thumb).getBoundingClientRect();
    return { top: r.top, mid: r.top + r.height / 2 };
  });
}

/** Index of the gap the pointer is over: before the first row whose midpoint is below it. */
function insertionIndexAt(clientY: number, rows: Row[]): number {
  const i = rows.findIndex((r) => clientY < r.mid);
  return i === -1 ? rows.length : i;
}
