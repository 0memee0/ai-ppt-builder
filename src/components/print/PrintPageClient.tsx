"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Deck } from "@/lib/deck/types";
import { lastDeckId, loadDeckRecord } from "@/lib/storage/decks";
import { PrintView } from "./PrintView";

type State = { kind: "loading" } | { kind: "ready"; deck: Deck } | { kind: "empty" };

/** Loads the last open deck from IndexedDB; the print route has no store of its own. */
export function PrintPageClient() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const id = lastDeckId();
    if (!id) {
      setState({ kind: "empty" });
      return;
    }
    loadDeckRecord(id)
      .then((record) => {
        if (cancelled) return;
        setState(record && record.deck.slides.length ? { kind: "ready", deck: record.deck } : { kind: "empty" });
      })
      .catch(() => !cancelled && setState({ kind: "empty" }));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "ready") return <PrintView deck={state.deck} />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ground text-center">
      {state.kind === "loading" ? (
        <p className="text-sm text-muted">Loading deck…</p>
      ) : (
        <>
          <p className="text-sm font-medium">Nothing to print yet</p>
          <p className="max-w-sm text-sm text-muted">Build a deck in the editor first; it is saved in this browser and exported from here.</p>
          <Link href="/" className="mt-2 text-sm text-blue hover:underline">
            Back to editor
          </Link>
        </>
      )}
    </div>
  );
}
