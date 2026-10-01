"use client";

import type { RecentDecksState } from "@/hooks/use-recent-decks";
import { ARTBOARD } from "@/lib/deck/constants";
import { DeckCard } from "./DeckCard";
import { Stage } from "./Stage";

type Props = {
  state: RecentDecksState;
  onDelete: (id: string) => void;
  /** Clicking the live tile; the landing focuses the prompt. */
  onNew: () => void;
  paused: boolean;
};

/**
 * Saved decks as a grid of 16:9 tiles with captions, like a shelf. The first
 * tile is live: a screen playing a deck, standing for the one you are about
 * to describe.
 */
export function RecentDecks({ state, onDelete, onNew, paused }: Props) {
  return (
    <section aria-labelledby="recent-heading">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 id="recent-heading" className="text-sm font-medium">
          Your decks
        </h2>
        <span className="text-xs text-faint">Saved in this browser</span>
      </div>

      <ul className="grid grid-cols-2 gap-x-5 gap-y-7 pt-6 sm:grid-cols-3 lg:grid-cols-4">
        <li>
          <button type="button" onClick={onNew} className="group block w-full text-left">
            <div
              className="overflow-hidden rounded-lg border border-line transition-[border-color,box-shadow] group-hover:border-line-strong group-hover:shadow-[0_8px_24px_rgba(22,22,22,0.08)]"
              style={{ aspectRatio: `${ARTBOARD.w} / ${ARTBOARD.h}` }}
            >
              <Stage paused={paused} />
            </div>
            <p className="mt-2.5 truncate text-sm font-medium">New deck</p>
            <p className="mt-0.5 text-xs text-muted">{paused ? "Waiting for your prompt" : "Describe it above"}</p>
          </button>
        </li>

        {state.kind === "ready" &&
          state.decks.map((deck) => (
            <li key={deck.id}>
              <DeckCard deck={deck} onDelete={() => onDelete(deck.id)} />
            </li>
          ))}
      </ul>

      {state.kind === "error" && (
        <p className="pt-6 text-sm text-muted">Saved decks could not be read in this browser.</p>
      )}
    </section>
  );
}
