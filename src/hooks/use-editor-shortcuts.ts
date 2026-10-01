"use client";

import { useEffect } from "react";
import { useDeckStore } from "@/store/deck-store";
import type { useEditorActions } from "./use-editor-actions";

type Actions = ReturnType<typeof useEditorActions>;

const NUDGE = 8;
const NUDGE_FAST = 40;

/**
 * Global editor keys. Ignored while typing in an input, textarea, or
 * contenteditable so the chat composer and inspector fields keep theirs.
 *
 *   ⌫ / Delete   delete selection        ⌘D         duplicate selection
 *   ⌘Z / ⇧⌘Z     undo / redo             Esc        clear selection
 *   arrows        nudge selection 8 (⇧ 40); with nothing selected, ←/→ change slide
 */
export function useEditorShortcuts(actions: Actions) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const store = useDeckStore.getState();
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (meta && key === "z") {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (meta && key === "d") {
        e.preventDefault();
        actions.duplicateSelection();
        return;
      }
      if (meta) return;

      const hasSelection = store.selectedElementIds.length > 0;
      switch (e.key) {
        case "Backspace":
        case "Delete":
          if (hasSelection) {
            e.preventDefault();
            actions.deleteSelection();
          }
          return;
        case "Escape":
          store.clearSelection();
          return;
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown": {
          e.preventDefault();
          const step = e.shiftKey ? NUDGE_FAST : NUDGE;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          if (hasSelection) actions.nudge(dx, dy);
          else if (dx) store.stepSlide(dx > 0 ? 1 : -1);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
