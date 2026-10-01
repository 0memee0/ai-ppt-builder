"use client";

import { BarChart3, Copy, Trash2 } from "lucide-react";
import { SlideView } from "@/components/slide/SlideView";
import { slideTitle } from "@/lib/deck/constants";
import type { Slide } from "@/lib/deck/types";

export const THUMB_WIDTH = 156;

type Props = {
  slide: Slide;
  index: number;
  active: boolean;
  /** Slide under an element being dragged from the canvas. */
  dropTarget: boolean;
  dropLabel?: string;
  /** This slide is being dragged: the row shows where it will land, the ghost shows the slide. */
  placeholder: boolean;
  /** The floating copy that follows the pointer during a reorder. */
  ghost?: boolean;
  /** Slide has an outline but no elements yet. */
  pending: boolean;
  onSelect: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  /** Omit both to hide the hover actions (model turn in flight). */
  onDuplicate?: () => void;
  onDelete?: () => void;
};

export function Thumbnail({
  slide,
  index,
  active,
  dropTarget,
  dropLabel,
  placeholder,
  ghost = false,
  pending,
  onSelect,
  onPointerDown,
  onDuplicate,
  onDelete,
}: Props) {
  const ring =
    dropTarget || ghost
      ? "bg-spectrum p-[2px]"
      : active
        ? "bg-ink p-[2px]"
        : "bg-line p-px group-hover:bg-line-strong";

  const wrapper = ghost
    ? "rotate-[-1.5deg] scale-[1.04] bg-panel shadow-[0_2px_4px_rgba(22,22,22,0.08),0_16px_40px_rgba(22,22,22,0.22)] ring-1 ring-line"
    : dropTarget
      ? "bg-white"
      : "";

  return (
    <div className={`group relative flex w-full gap-2 rounded-lg p-1.5 transition-transform ${wrapper}`}>
      <span className={`w-4 pt-0.5 text-right text-xs tabular-nums ${active ? "text-ink" : "text-faint"}`}>
        {index + 1}
      </span>
      <button
        type="button"
        data-slide-id={slide.id}
        data-slide-index={index}
        onClick={onSelect}
        onPointerDown={onPointerDown}
        aria-current={active ? "true" : undefined}
        aria-label={`Slide ${index + 1}: ${slideTitle(slide)}`}
        className="min-w-0 flex-1 touch-none text-left"
      >
        {placeholder ? (
          <span
            aria-hidden
            className="block rounded-md border-2 border-dashed border-blue/50 bg-blue/5"
            style={{ width: THUMB_WIDTH + 4, aspectRatio: "16 / 9" }}
          />
        ) : (
          <span className={`relative block w-fit rounded-md ${ring}`}>
            <SlideView slide={slide} width={THUMB_WIDTH} className="rounded-[5px]" />
            {pending && (
              <span className="absolute inset-x-[2px] bottom-[2px] h-0.5 overflow-hidden rounded-b-[5px] bg-line">
                <span className="stream-bar bg-spectrum block h-full w-1/3" />
              </span>
            )}
            {dropTarget && (
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-ink/90 px-2 py-1 text-[11px] text-white shadow-lg">
                <BarChart3 className="size-3.5" />
                {dropLabel}
              </span>
            )}
          </span>
        )}
        <span className={`mt-1 block truncate text-xs ${placeholder ? "text-transparent" : active ? "text-ink" : "text-muted"}`}>
          {slideTitle(slide)}
        </span>
      </button>

      {(onDuplicate || onDelete) && !placeholder && (
        <span className="absolute right-2.5 top-2.5 flex gap-0.5 rounded-md border border-line bg-white p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {onDuplicate && (
            <SlideAction label="Duplicate slide" onClick={onDuplicate}>
              <Copy className="size-3.5" />
            </SlideAction>
          )}
          {onDelete && (
            <SlideAction label="Delete slide" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </SlideAction>
          )}
        </span>
      )}
    </div>
  );
}

function SlideAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex size-6 items-center justify-center rounded text-muted hover:bg-ground hover:text-ink"
    >
      {children}
    </button>
  );
}
