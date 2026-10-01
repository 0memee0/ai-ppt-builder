"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { SlideView } from "@/components/slide/SlideView";
import { ThemeProvider } from "@/components/slide/ThemeContext";
import { getTheme } from "@/lib/deck/theme";
import type { Deck } from "@/lib/deck/types";

/** 13.333in × 7.5in at 96dpi, the standard 16:9 slide page. */
const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 720;

/**
 * One slide per page. Each section is pinned to the page box so sub-pixel
 * rounding never spills a slide onto a blank second page, and fills are kept
 * (`print-color-adjust`, in globals) even when the dialog has background
 * graphics off. Slides are scaled with `zoom`, not `transform`: see SlideView.
 */
const PRINT_CSS = `
@page { size: 13.333in 7.5in; margin: 0; }
@media print {
  html, body { background: #fff; }
  [data-print-page] {
    width: ${PAGE_WIDTH}px;
    height: ${PAGE_HEIGHT}px;
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  [data-print-page]:not(:last-child) {
    break-after: page;
    page-break-after: always;
  }
}`;

export function PrintView({ deck }: { deck: Deck }) {
  return (
    <div className="min-h-screen bg-ground print:bg-white">
      <style>{PRINT_CSS}</style>

      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-panel px-6 py-3 print:hidden">
        <Link href={`/editor/${deck.id}`} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" />
          Back to editor
        </Link>
        <div className="flex-1 text-center">
          <p className="text-sm font-medium">{deck.title || "Untitled deck"}</p>
          <p className="text-xs text-muted">
            {deck.slides.length} slides · 16:9 · choose “Save as PDF” in the print dialog
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-spectrum flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
        >
          <Printer className="size-4" />
          Print or save PDF
        </button>
      </header>

      <ThemeProvider theme={getTheme(deck.themeId)}>
        <main className="flex flex-col items-center gap-8 py-8 print:block print:p-0">
          {deck.slides.map((slide) => (
            <section
              key={slide.id}
              data-print-page
              className="shadow-[0_8px_32px_rgba(22,22,22,0.08)] print:shadow-none"
            >
              <SlideView slide={slide} width={PAGE_WIDTH} fit="zoom" />
            </section>
          ))}
        </main>
      </ThemeProvider>
    </div>
  );
}
