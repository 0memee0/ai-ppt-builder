"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import type { DeckSummary } from "@/lib/storage/decks";

type Props = {
  onBlank: () => void;
  disabled?: boolean;
  /** Most recently saved deck, when there is one. */
  last: DeckSummary | null;
};

/** Deliberately quiet: no fill, hairline border; the prompt box above stays the one bright thing. */
const CARD =
  "flex w-full max-w-xs items-start gap-3 rounded-xl border border-line/70 bg-transparent px-4 py-3 text-left text-muted transition-colors hover:border-line-strong hover:bg-panel hover:text-ink disabled:opacity-40 disabled:hover:border-line/70 disabled:hover:bg-transparent";

/** The two ways in that skip the prompt: a blank deck, or the last one you worked on. */
export function QuickActions({ onBlank, disabled = false, last }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onBlank} disabled={disabled} className={CARD}>
        <Plus className="mt-0.5 size-4 shrink-0 text-faint" />
        <span className="min-w-0">
          <span className="block text-sm font-medium">Start with a blank deck</span>
          <span className="mt-0.5 block text-xs text-faint">Build slides by hand with the toolbar; ask for help any time.</span>
        </span>
      </button>
      {last && (
        <Link href={`/editor/${last.id}`} className={CARD}>
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-faint" />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Continue where you left off</span>
            <span className="mt-0.5 block truncate text-xs text-faint">{last.title || "Untitled deck"}</span>
          </span>
        </Link>
      )}
    </div>
  );
}
