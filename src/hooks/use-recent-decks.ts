"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteDeckRecord, listDeckRecords, type DeckSummary } from "@/lib/storage/decks";

export type RecentDecksState = { kind: "loading" } | { kind: "ready"; decks: DeckSummary[] } | { kind: "error" };

/** Decks saved in this browser, newest first, with optimistic delete. */
export function useRecentDecks() {
  const [state, setState] = useState<RecentDecksState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    listDeckRecords()
      .then((decks) => !cancelled && setState({ kind: "ready", decks }))
      .catch(() => !cancelled && setState({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = useCallback(async (id: string) => {
    setState((s) => (s.kind === "ready" ? { kind: "ready", decks: s.decks.filter((d) => d.id !== id) } : s));
    await deleteDeckRecord(id);
  }, []);

  return { state, remove };
}
