"use client";

import { useCallback, useMemo } from "react";
import { useDeckStore } from "@/store/deck-store";

export type InsertKind = "text" | "image" | "chart" | "table" | "shape";

/**
 * Toolbar and filmstrip actions. Each one is a tool call against the active
 * slide, so manual edits and model edits share reducers and undo entries.
 */
export function useEditorActions() {
  const run = useDeckStore((s) => s.run);
  const runBatch = useDeckStore((s) => s.runBatch);

  const active = () => {
    const { deck, activeSlideId, selectedElementIds } = useDeckStore.getState();
    const slide = deck.slides.find((s) => s.id === activeSlideId) ?? null;
    return { deck, slide, selectedElementIds };
  };

  const insert = useCallback(
    (kind: InsertKind) => {
      const { slide } = active();
      if (!slide) return;
      const slideId = slide.id;
      const out =
        kind === "chart"
          ? run("add_chart", {
              slideId,
              chartType: "bar",
              title: "Chart title",
              categories: ["Q1", "Q2", "Q3", "Q4"],
              series: [{ name: "Series 1", values: [12, 18, 15, 24] }],
            })
          : kind === "text"
            ? run("add_element", { slideId, type: "text", text: "New text", role: "body" })
            : kind === "image"
              ? run("add_element", { slideId, type: "image", src: { kind: "placeholder", label: "Image" } })
              : kind === "table"
                ? run("add_element", {
                    slideId,
                    type: "table",
                    columns: ["Column 1", "Column 2", "Column 3"],
                    rows: [
                      ["", "", ""],
                      ["", "", ""],
                    ],
                  })
                : run("add_element", { slideId, type: "shape", shape: "rect" });
      if (out.ok && out.result.elementId) useDeckStore.getState().select([out.result.elementId]);
    },
    [run],
  );

  const deleteSelection = useCallback(() => {
    const { slide, selectedElementIds } = active();
    if (!slide || selectedElementIds.length === 0) return;
    runBatch(
      selectedElementIds.length === 1 ? "Delete element" : `Delete ${selectedElementIds.length} elements`,
      selectedElementIds.map((elementId) => ({ name: "delete_element", args: { slideId: slide.id, elementId } })),
    );
  }, [runBatch]);

  const duplicateSelection = useCallback(() => {
    const { slide, selectedElementIds } = active();
    if (!slide || selectedElementIds.length === 0) return;
    const outcomes = runBatch(
      "Duplicate selection",
      selectedElementIds.map((elementId) => {
        const el = slide.elements.find((e) => e.id === elementId)!;
        return {
          name: "move_element",
          args: {
            elementId,
            fromSlideId: slide.id,
            toSlideId: slide.id,
            copy: true,
            frame: { x: el.frame.x + 40, y: el.frame.y + 40 },
          },
        };
      }),
    );
    const created = outcomes.flatMap((o) => (o.ok && o.result.elementId ? [o.result.elementId] : []));
    if (created.length) useDeckStore.getState().select(created);
  }, [runBatch]);

  /** Shifts every selected element by (dx, dy) logical units. */
  const nudge = useCallback(
    (dx: number, dy: number) => {
      const { slide, selectedElementIds } = active();
      if (!slide || selectedElementIds.length === 0 || (dx === 0 && dy === 0)) return;
      runBatch(
        "Nudge",
        selectedElementIds.flatMap((elementId) => {
          const el = slide.elements.find((e) => e.id === elementId);
          if (!el || el.locked) return [];
          return [
            {
              name: "move_element" as const,
              args: {
                elementId,
                fromSlideId: slide.id,
                toSlideId: slide.id,
                frame: { x: el.frame.x + dx, y: el.frame.y + dy },
              },
            },
          ];
        }),
      );
    },
    [runBatch],
  );

  /** Moves the single selected element one step in z-order. */
  const shiftZ = useCallback(
    (delta: 1 | -1) => {
      const { slide, selectedElementIds } = active();
      if (!slide || selectedElementIds.length !== 1) return;
      const elementId = selectedElementIds[0];
      const index = slide.elements.findIndex((e) => e.id === elementId);
      const toIndex = Math.max(0, Math.min(slide.elements.length - 1, index + delta));
      if (toIndex !== index) run("reorder_elements", { slideId: slide.id, elementId, toIndex });
    },
    [run],
  );

  const addSlide = useCallback(() => {
    const { deck, slide } = active();
    const index = slide ? deck.slides.findIndex((s) => s.id === slide.id) + 1 : deck.slides.length;
    const out = run("add_slide", { index, layout: "content", title: "New slide" });
    if (out.ok && out.result.slideId) useDeckStore.getState().setActiveSlide(out.result.slideId);
  }, [run]);

  /** Defaults to the active slide. */
  const deleteSlide = useCallback(
    (slideId?: string) => {
      const id = slideId ?? active().slide?.id;
      if (id) run("delete_slide", { slideId: id });
    },
    [run],
  );

  /** Defaults to the active slide; the copy becomes active. */
  const duplicateSlide = useCallback(
    (slideId?: string) => {
      const id = slideId ?? active().slide?.id;
      if (!id) return;
      const out = run("duplicate_slide", { slideId: id });
      if (out.ok && out.result.slideId) useDeckStore.getState().setActiveSlide(out.result.slideId);
    },
    [run],
  );

  return useMemo(
    () => ({ insert, deleteSelection, duplicateSelection, nudge, shiftZ, addSlide, deleteSlide, duplicateSlide }),
    [insert, deleteSelection, duplicateSelection, nudge, shiftZ, addSlide, deleteSlide, duplicateSlide],
  );
}
