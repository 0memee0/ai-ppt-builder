"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragPreview, Handle } from "@/components/editor/artboard/types";
import { ARTBOARD, MIN_ELEMENT_SIZE } from "@/lib/deck/constants";
import { clampFrame } from "@/lib/deck/geometry";
import { snapMove } from "@/lib/deck/snap";
import type { Frame } from "@/lib/deck/types";
import { useDeckStore } from "@/store/deck-store";

/** Screen pixels before a press becomes a drag; below this it is a click. */
const DRAG_THRESHOLD = 3;
/** Snap distance in screen pixels, converted to logical units per gesture. */
const SNAP_PX = 6;

type Session =
  | {
      kind: "move";
      slideId: string;
      ids: string[];
      origins: Map<string, Frame>;
      others: Frame[];
      startX: number;
      startY: number;
      scale: number;
    }
  | { kind: "resize"; slideId: string; id: string; origin: Frame; handle: Handle; startX: number; startY: number; scale: number };

/**
 * Pointer gestures on the artboard. Move (with alignment snapping), resize
 * from a handle, Alt-drag to copy, drop on a filmstrip thumbnail to move
 * across slides, Escape to cancel. Nothing touches the store until pointer
 * up; the preview is applied visually by the Artboard.
 */
export function useDragGesture(enabled: boolean) {
  const [preview, setPreview] = useState<DragPreview | undefined>();
  const previewRef = useRef<DragPreview | undefined>(undefined);
  const session = useRef<Session | null>(null);
  const detach = useRef<() => void>(() => {});

  const show = (p: DragPreview | undefined) => {
    previewRef.current = p;
    setPreview(p);
  };

  const end = useCallback(() => {
    detach.current();
    detach.current = () => {};
    session.current = null;
    show(undefined);
  }, []);

  useEffect(() => end, [end]);

  const commit = useCallback(() => {
    const s = session.current;
    const p = previewRef.current;
    if (!s || !p) return;
    const store = useDeckStore.getState();

    if (s.kind === "resize" && p.kind === "resize") {
      const { x, y, w, h } = p.frame;
      store.run("resize_element", { slideId: s.slideId, elementId: s.id, frame: { x, y, w, h } });
      return;
    }
    if (s.kind !== "move") return;

    if (p.kind === "move") {
      const label = p.copy ? "Copy" : "Move";
      const outcomes = store.runBatch(
        `${label} ${s.ids.length === 1 ? "element" : `${s.ids.length} elements`}`,
        s.ids.map((elementId) => {
          const o = s.origins.get(elementId)!;
          return {
            name: "move_element" as const,
            args: {
              elementId,
              fromSlideId: s.slideId,
              toSlideId: s.slideId,
              copy: p.copy || undefined,
              frame: { x: o.x + p.dx, y: o.y + p.dy },
            },
          };
        }),
      );
      if (p.copy) {
        const created = outcomes.flatMap((o) => (o.ok && o.result.elementId ? [o.result.elementId] : []));
        if (created.length) store.select(created);
      }
      return;
    }

    if (p.kind === "cross") {
      store.runBatch(
        p.targetLabel,
        s.ids.map((elementId) => ({
          name: "move_element" as const,
          args: { elementId, fromSlideId: s.slideId, toSlideId: p.targetSlideId, copy: p.copy || undefined },
        })),
      );
      if (!p.copy) store.clearSelection();
    }
  }, []);

  const attach = useCallback(() => {
    const onMove = (e: PointerEvent) => {
      const s = session.current;
      if (!s) return;
      const dxPx = e.clientX - s.startX;
      const dyPx = e.clientY - s.startY;
      if (!previewRef.current && Math.hypot(dxPx, dyPx) < DRAG_THRESHOLD) return;
      const dx = dxPx / s.scale;
      const dy = dyPx / s.scale;

      if (s.kind === "resize") {
        show({ kind: "resize", elementId: s.id, frame: resizeFrame(s.origin, s.handle, dx, dy, e.shiftKey) });
        return;
      }

      const target = thumbnailAt(e.clientX, e.clientY);
      if (target && target.slideId !== s.slideId) {
        show({
          kind: "cross",
          elementIds: s.ids,
          targetSlideId: target.slideId,
          targetLabel: `${e.altKey ? "Copy" : "Move"} to slide ${target.index + 1}`,
          copy: e.altKey,
        });
        return;
      }

      const moving = s.ids.map((id) => s.origins.get(id)!);
      const snapped = snapMove(moving, dx, dy, s.others, SNAP_PX / s.scale);
      show({ kind: "move", elementIds: s.ids, dx: Math.round(snapped.dx), dy: Math.round(snapped.dy), guides: snapped.guides, copy: e.altKey });
    };
    const onUp = () => {
      commit();
      end();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
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
  }, [commit, end]);

  /** Hit target pressed. Handles selection, then arms a move for the selected set. */
  const onElementPointerDown = useCallback(
    (e: React.PointerEvent, elementId: string) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      const store = useDeckStore.getState();
      if (e.shiftKey) {
        store.toggleSelect(elementId);
        return;
      }
      const already = store.selectedElementIds.includes(elementId);
      const ids = already ? store.selectedElementIds : [elementId];
      if (!already) store.select(ids);
      if (!enabled) return;

      const slide = store.deck.slides.find((s) => s.id === store.activeSlideId);
      if (!slide) return;
      const movable = slide.elements.filter((el) => ids.includes(el.id) && !el.locked);
      if (movable.length === 0) return;

      e.preventDefault();
      session.current = {
        kind: "move",
        slideId: slide.id,
        ids: movable.map((el) => el.id),
        origins: new Map(movable.map((el) => [el.id, el.frame])),
        others: slide.elements.filter((el) => !ids.includes(el.id)).map((el) => el.frame),
        startX: e.clientX,
        startY: e.clientY,
        scale: scaleFrom(e.currentTarget),
      };
      attach();
    },
    [attach, enabled],
  );

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent, handle: Handle) => {
      if (!enabled || e.button !== 0) return;
      const store = useDeckStore.getState();
      const slide = store.deck.slides.find((s) => s.id === store.activeSlideId);
      const id = store.selectedElementIds[0];
      const el = slide?.elements.find((x) => x.id === id);
      if (!slide || !el || el.locked) return;

      e.preventDefault();
      session.current = {
        kind: "resize",
        slideId: slide.id,
        id: el.id,
        origin: el.frame,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        scale: scaleFrom(e.currentTarget),
      };
      attach();
    },
    [attach, enabled],
  );

  return { drag: preview, onElementPointerDown, onHandlePointerDown };
}

/** Logical→screen scale, read from the artboard the event came from. */
function scaleFrom(target: EventTarget & Element): number {
  const root = target.closest<HTMLElement>("[data-artboard]");
  return root ? root.getBoundingClientRect().width / ARTBOARD.w : 1;
}

/** Filmstrip thumbnail under the pointer, if any. */
function thumbnailAt(x: number, y: number): { slideId: string; index: number } | null {
  const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slide-id]");
  if (!hit?.dataset.slideId) return null;
  return { slideId: hit.dataset.slideId, index: Number(hit.dataset.slideIndex ?? 0) };
}

function resizeFrame(o: Frame, handle: Handle, dx: number, dy: number, keepRatio: boolean): Frame {
  let { x, y, w, h } = o;
  if (handle.fx === 0) (x = o.x + dx), (w = o.w - dx);
  else if (handle.fx === 1) w = o.w + dx;
  if (handle.fy === 0) (y = o.y + dy), (h = o.h - dy);
  else if (handle.fy === 1) h = o.h + dy;

  if (keepRatio && handle.fx !== 0.5 && handle.fy !== 0.5) {
    const ratio = o.w / o.h;
    if (Math.abs(w - o.w) > Math.abs(h - o.h) * ratio) h = w / ratio;
    else w = h * ratio;
    if (handle.fx === 0) x = o.x + o.w - w;
    if (handle.fy === 0) y = o.y + o.h - h;
  }

  if (w < MIN_ELEMENT_SIZE) {
    if (handle.fx === 0) x = o.x + o.w - MIN_ELEMENT_SIZE;
    w = MIN_ELEMENT_SIZE;
  }
  if (h < MIN_ELEMENT_SIZE) {
    if (handle.fy === 0) y = o.y + o.h - MIN_ELEMENT_SIZE;
    h = MIN_ELEMENT_SIZE;
  }
  return clampFrame({ x, y, w, h, rotation: o.rotation });
}
