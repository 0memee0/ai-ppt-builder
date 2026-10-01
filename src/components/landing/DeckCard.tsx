"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { SlideView } from "@/components/slide/SlideView";
import { ThemeProvider } from "@/components/slide/ThemeContext";
import { useElementSize } from "@/hooks/use-element-size";
import { ARTBOARD } from "@/lib/deck/constants";
import { getTheme } from "@/lib/deck/theme";
import type { DeckSummary } from "@/lib/storage/decks";
import { timeAgo } from "@/lib/time";

type Props = { deck: DeckSummary; onDelete: () => void };

/** One saved deck as a tile: 16:9 cover, caption below. Delete shows on hover. */
export function DeckCard({ deck, onDelete }: Props) {
  const [coverRef, cover] = useElementSize<HTMLDivElement>();
  const title = deck.title || "Untitled deck";
  return (
    <div className="group relative">
      <Link href={`/editor/${deck.id}`} className="block">
        <div
          ref={coverRef}
          className="overflow-hidden rounded-lg border border-line bg-white transition-[border-color,box-shadow] group-hover:border-line-strong group-hover:shadow-[0_8px_24px_rgba(22,22,22,0.08)]"
          style={{ aspectRatio: `${ARTBOARD.w} / ${ARTBOARD.h}` }}
        >
          {deck.cover && cover.width > 0 ? (
            <ThemeProvider theme={getTheme(deck.themeId)}>
              <SlideView slide={deck.cover} width={cover.width} />
            </ThemeProvider>
          ) : deck.cover ? null : (
            <div className="flex h-full items-center justify-center text-xs text-faint">Empty deck</div>
          )}
        </div>
        <p className="mt-2.5 truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {deck.slideCount} slide{deck.slideCount === 1 ? "" : "s"} · {timeAgo(deck.updatedAt)}
        </p>
      </Link>

      <button
        type="button"
        aria-label={`Delete ${title}`}
        title="Delete deck"
        onClick={onDelete}
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md border border-line bg-white text-muted opacity-0 shadow-sm transition-opacity hover:text-danger focus:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
