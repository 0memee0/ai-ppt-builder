"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { SKELETON_KINDS, SlideSkeleton } from "./SlideSkeleton";

const SLIDE_MS = 3300;
/** Height of the present-mode strip at the bottom, as a share of the frame. */
const CHROME = "16%";

type Shown = { index: number; previous: number | null };

/**
 * The projector screen: a 16:9 frame in which wireframe slides play as a
 * slideshow. Each change hoists the next slide up into the frame on a thread
 * while the one before falls away from the viewer; the slide drifts closer
 * while it is held. `paused` (the user is typing) holds it on slide 1.
 * Fills its parent; the parent decides the size and any border.
 */
export function Stage({ paused }: { paused: boolean }) {
  const [shown, setShown] = useState<Shown>({ index: 0, previous: null });

  useEffect(() => {
    if (paused) {
      setShown((s) => (s.index === 0 ? s : { index: 0, previous: s.index }));
      return;
    }
    const id = setInterval(
      () => setShown((s) => ({ index: (s.index + 1) % SKELETON_KINDS.length, previous: s.index })),
      SLIDE_MS,
    );
    return () => clearInterval(id);
  }, [paused]);

  const { index, previous } = shown;

  return (
    <div aria-hidden className="relative h-full w-full overflow-hidden bg-white" style={{ perspective: 1400 }}>
      {/* Slides live above the chrome strip so nothing runs into the counter. */}
      {previous !== null && previous !== index && (
        <div key={`out-${previous}-${index}`} className="recede absolute inset-x-0 top-0" style={{ color: tint(previous), bottom: CHROME }}>
          <SlideSkeleton kind={SKELETON_KINDS[previous]} />
        </div>
      )}

      <div key={`in-${index}`} className="absolute inset-x-0 top-0" style={{ bottom: CHROME }}>
        <span className="thread bg-spectrum absolute left-1/2 top-0 h-[18%] w-px -translate-x-1/2" style={{ opacity: 0.7 }} />
        <div className="hoist absolute inset-0" style={{ color: tint(index) }}>
          <SlideSkeleton kind={SKELETON_KINDS[index]} animate />
        </div>
      </div>

      {/* present-mode chrome */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 py-2.5 text-[10px] text-muted">
        <span className="flex size-4 items-center justify-center rounded-full bg-ink text-white">
          {paused ? <Pause className="size-2" /> : <Play className="size-2 translate-x-px" />}
        </span>
        <span className="tabular-nums">
          {index + 1} / {SKELETON_KINDS.length}
        </span>
        <span className="flex flex-1 gap-1">
          {SKELETON_KINDS.map((kind, i) => (
            <span key={kind} className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-line">
              {i < index && <span className="bg-spectrum absolute inset-0" />}
              {i === index && !paused && (
                <span
                  key={index}
                  className="bg-spectrum progress absolute inset-y-0 left-0"
                  style={{ animationDuration: `${SLIDE_MS}ms` }}
                />
              )}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Slide 1 is blue, the last is orange, the rest in between. */
function tint(i: number): string {
  const t = i / (SKELETON_KINDS.length - 1);
  return `color-mix(in oklab, var(--color-orange) ${Math.round(t * 100)}%, var(--color-blue))`;
}
