"use client";

import { useShallow } from "zustand/react/shallow";
import type { Slide, SlideElement } from "@/lib/deck/types";
import { useDeckStore } from "./deck-store";

export const useDeck = () => useDeckStore((s) => s.deck);

export const useSlides = () => useDeckStore((s) => s.deck.slides);

export const useActiveSlideId = () => useDeckStore((s) => s.activeSlideId);

export function useActiveSlide(): { slide: Slide | null; index: number } {
  return useDeckStore(
    useShallow((s) => {
      const index = s.deck.slides.findIndex((sl) => sl.id === s.activeSlideId);
      return { slide: index >= 0 ? s.deck.slides[index] : null, index };
    }),
  );
}

export const useSelectedIds = () => useDeckStore((s) => s.selectedElementIds);

/** Selected elements on the active slide, in z-order. */
export function useSelectedElements(): SlideElement[] {
  return useDeckStore(
    useShallow((s) => {
      const slide = s.deck.slides.find((sl) => sl.id === s.activeSlideId);
      if (!slide) return [];
      const ids = new Set(s.selectedElementIds);
      return slide.elements.filter((el) => ids.has(el.id));
    }),
  );
}

export function useHistory() {
  return useDeckStore(
    useShallow((s) => ({
      canUndo: s.history.index >= 0 && s.agent.status !== "streaming",
      canRedo: s.history.index < s.history.entries.length - 1 && s.agent.status !== "streaming",
      undo: s.undo,
      redo: s.redo,
    })),
  );
}

export const useAgentStatus = () => useDeckStore((s) => s.agent.status);

/** Planned slides still waiting for content, limited to ones that still exist. */
export function usePendingSlideIds(): Set<string> {
  return useDeckStore(
    useShallow((s) => {
      const present = new Set(s.deck.slides.map((sl) => sl.id));
      return new Set(s.agent.pendingSlideIds.filter((id) => present.has(id)));
    }),
  );
}

export const useIsBusy = () => useDeckStore((s) => s.agent.status === "streaming");

export const useMessages = () => useDeckStore((s) => s.messages);

/** Stable action bundle for components that only write. */
export function useDeckActions() {
  return useDeckStore(
    useShallow((s) => ({
      run: s.run,
      runBatch: s.runBatch,
      commit: s.commit,
      setTitle: s.setTitle,
      setActiveSlide: s.setActiveSlide,
      stepSlide: s.stepSlide,
      select: s.select,
      toggleSelect: s.toggleSelect,
      clearSelection: s.clearSelection,
    })),
  );
}
