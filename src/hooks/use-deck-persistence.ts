"use client";

import { useEffect, useState } from "react";
import { emptyDeck } from "@/lib/deck/tools/slides";
import { loadDeckRecord, rememberLastDeck, saveDeckRecord } from "@/lib/storage/decks";
import { useDeckStore } from "@/store/deck-store";

export type SaveStatus = "restoring" | "saved" | "saving" | "error";

const DEBOUNCE_MS = 400;

/**
 * Loads `deckId` from IndexedDB on mount (a fresh empty deck under that id if
 * nothing is stored), then autosaves deck, chat, and pending-slide state
 * whenever they change. Saving is debounced and blocked until the restore has
 * finished, so the initial empty store can never overwrite a saved deck.
 */
export function useDeckPersistence(deckId: string): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("restoring");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe = () => {};
    setStatus("restoring");

    const restore = async () => {
      const store = useDeckStore.getState();
      try {
        const record = await loadDeckRecord(deckId);
        if (cancelled) return;
        if (record) {
          store.loadDeck(record.deck, record.messages);
          store.setPendingSlides(record.pendingSlideIds);
        } else if (store.deck.id !== deckId) {
          store.loadDeck({ ...emptyDeck(), id: deckId }, []);
        }
      } catch {
        if (cancelled) return;
        if (store.deck.id !== deckId) store.loadDeck({ ...emptyDeck(), id: deckId }, []);
      }
      rememberLastDeck(deckId);
      setStatus("saved");

      let last = snapshot();
      unsubscribe = useDeckStore.subscribe(() => {
        const next = snapshot();
        if (next.deck === last.deck && next.messages === last.messages && next.pending === last.pending) return;
        last = next;
        if (next.deck.id !== deckId) return; // mid-navigation to another deck
        setStatus("saving");
        clearTimeout(timer);
        timer = setTimeout(() => {
          const { deck, messages, pending } = snapshot();
          saveDeckRecord({ id: deck.id, title: deck.title, deck, messages, pendingSlideIds: pending })
            .then(() => !cancelled && setStatus("saved"))
            .catch(() => !cancelled && setStatus("error"));
        }, DEBOUNCE_MS);
      });
    };

    void restore();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [deckId]);

  return status;
}

function snapshot() {
  const s = useDeckStore.getState();
  return { deck: s.deck, messages: s.messages, pending: s.agent.pendingSlideIds };
}
