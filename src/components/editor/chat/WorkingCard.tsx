"use client";

import { useEffect, useRef, useState } from "react";
import { slideTitle } from "@/lib/deck/constants";
import { useDeckStore } from "@/store/deck-store";
import { usePendingSlideIds } from "@/store/selectors";
import type { ChatMessage } from "../types";

/** Shown under a streaming reply: a slide taking shape, and a line on what the model is doing. */
export function WorkingCard({ message }: { message: ChatMessage }) {
  const pending = usePendingSlideIds();
  const slides = useDeckStore((s) => s.deck.slides);
  const tick = useTick(TICK_MS);
  const startedAt = useRef(Date.now());

  // Wall-clock slices, not a mount counter: the verb holds for a full slice
  // even if the card re-renders or remounts while tool results stream in.
  const verb = VERBS[(hash(message.id) + Math.floor(Date.now() / TICK_MS)) % VERBS.length];
  const running = [...(message.steps ?? [])].reverse().find((s) => s.status === "running");
  const current = slides.find((s) => pending.has(s.id));
  const started = (message.steps?.length ?? 0) > 0;

  const headline = current
    ? `${verb} slide ${slides.indexOf(current) + 1} of ${slides.length}`
    : slides.length === 0
      ? `${verb} the outline`
      : `${verb} the changes`;
  const latest = current ? slideTitle(current) : running?.label ?? (started ? "Almost there" : "Reading the deck");
  const detail = useHeld(latest, tick);
  const slow = !started && Date.now() - startedAt.current > 8000;

  return (
    <div className="rounded-lg border border-line bg-white p-2.5" role="status" aria-live="polite" aria-label={headline}>
      <SlidePlaceholder chart={current?.layout === "chart-forward" || !current} />
      <p key={verb} className="rise mt-2.5 flex items-center gap-2 text-sm text-ink">
        <span className="bg-spectrum size-2 shrink-0 animate-pulse rounded-full" />
        <span className="font-medium">{headline}</span>
      </p>
      <p className="mt-0.5 truncate pl-4 text-xs text-muted">{slow ? "Still thinking. The first change usually lands within a few seconds." : detail}</p>
    </div>
  );
}

/** A 16:9 card with shimmering title and body blocks, plus a bar chart that keeps re-measuring itself. */
function SlidePlaceholder({ chart }: { chart: boolean }) {
  return (
    <div aria-hidden className="relative overflow-hidden rounded-md border border-line bg-ground" style={{ aspectRatio: "16 / 9" }}>
      <div className="absolute inset-x-[7%] top-[9%] h-[9%] w-[58%] rounded-sm shimmer" />
      <div className="absolute left-[7%] top-[26%] h-[5%] w-[40%] rounded-sm shimmer" style={{ animationDelay: "120ms" }} />
      <div className="absolute left-[7%] top-[36%] h-[5%] w-[34%] rounded-sm shimmer" style={{ animationDelay: "240ms" }} />
      <div className="absolute left-[7%] top-[46%] h-[5%] w-[38%] rounded-sm shimmer" style={{ animationDelay: "360ms" }} />
      {chart ? (
        <div className="absolute bottom-[12%] right-[7%] flex h-[56%] w-[40%] items-end gap-[6%]">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="grow-bar bg-spectrum block flex-1 origin-bottom rounded-t-sm opacity-70"
              style={{ height: `${h}%`, animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="absolute bottom-[12%] right-[7%] h-[56%] w-[40%] rounded-sm shimmer" style={{ animationDelay: "480ms" }} />
      )}
    </div>
  );
}

const BARS = [55, 80, 45, 100, 70];
/** How long each verb and detail line stays on screen. */
const TICK_MS = 5000;

const VERBS = [
  "Sketching",
  "Drafting",
  "Composing",
  "Arranging",
  "Plotting",
  "Shaping",
  "Storyboarding",
  "Weighing",
  "Framing",
  "Measuring",
  "Tidying",
  "Polishing",
];

function useTick(ms: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}

/** The value as it was at the last tick, so a fast-changing line only updates once per slice. */
function useHeld(value: string, tick: number): string {
  const latest = useRef(value);
  latest.current = value;
  const [held, setHeld] = useState(value);
  useEffect(() => {
    setHeld(latest.current);
  }, [tick]);
  return held;
}

/** Each reply starts the verb cycle somewhere different. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
