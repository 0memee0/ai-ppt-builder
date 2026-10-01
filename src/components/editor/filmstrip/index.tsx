"use client";

import { Plus } from "lucide-react";
import type { SlideReorderState } from "@/hooks/use-slide-reorder";
import type { Slide } from "@/lib/deck/types";
import { Thumbnail } from "./Thumbnail";

type Props = {
  slides: Slide[];
  activeSlideId: string | null;
  onSelect: (slideId: string) => void;
  /** Omit to disable the add button (model turn in flight). */
  onAdd?: () => void;
  /** Slide under an element being dragged from the canvas. */
  dropTargetId?: string;
  dropLabel?: string;
  /** A thumbnail is being dragged to a new index. */
  reorder?: SlideReorderState | null;
  /** Slide ids that only have an outline so far. */
  pendingIds?: Set<string>;
  onThumbnailPointerDown?: (e: React.PointerEvent, slideId: string, index: number) => void;
  /** Omit to hide per-slide actions (model turn in flight). */
  onDuplicate?: (slideId: string) => void;
  onDelete?: (slideId: string) => void;
};

export function Filmstrip({
  slides,
  activeSlideId,
  onSelect,
  onAdd,
  dropTargetId,
  dropLabel,
  reorder,
  pendingIds,
  onThumbnailPointerDown,
  onDuplicate,
  onDelete,
}: Props) {
  const dragged = reorder ? slides[reorder.fromIndex] : null;

  return (
    <nav aria-label="Slides" className={`flex w-56 shrink-0 flex-col border-r border-line bg-panel ${reorder ? "select-none" : ""}`}>
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Slides</span>
        <span className="text-xs text-faint">{slides.length}</span>
      </div>

      <ol className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {slides.map((slide, index) => (
          <li
            key={slide.id}
            className="relative"
            style={{
              transform: `translateY(${rowShift(index, reorder)}px)`,
              transition: "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            <Thumbnail
              slide={slide}
              index={index}
              active={slide.id === activeSlideId}
              dropTarget={slide.id === dropTargetId}
              dropLabel={dropLabel}
              placeholder={slide.id === reorder?.draggingSlideId}
              pending={pendingIds?.has(slide.id) ?? false}
              onSelect={() => onSelect(slide.id)}
              onPointerDown={onThumbnailPointerDown && ((e) => onThumbnailPointerDown(e, slide.id, index))}
              onDuplicate={onDuplicate && (() => onDuplicate(slide.id))}
              onDelete={onDelete && (() => onDelete(slide.id))}
            />
          </li>
        ))}
      </ol>

      {reorder && dragged && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50"
          style={{ top: reorder.ghost.top, left: reorder.ghost.left, width: reorder.ghost.width }}
        >
          <Thumbnail
            slide={dragged}
            index={reorder.toIndex}
            active={dragged.id === activeSlideId}
            dropTarget={false}
            placeholder={false}
            pending={false}
            ghost
            onSelect={() => {}}
          />
        </div>
      )}

      <div className="border-t border-line p-3">
        <button
          type="button"
          disabled={!onAdd}
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong py-2 text-sm text-muted hover:border-ink hover:text-ink disabled:text-faint disabled:hover:border-line-strong disabled:hover:text-faint"
        >
          <Plus className="size-4" />
          Add slide
        </button>
      </div>
    </nav>
  );
}

/**
 * How far row `index` moves while a drag is in flight. Rows between the old
 * and new position step one slot toward the old one, which closes the gap the
 * dragged slide left and opens one where it will land. The dragged row itself
 * jumps to the new gap and renders as a placeholder.
 */
function rowShift(index: number, reorder: SlideReorderState | null | undefined): number {
  if (!reorder) return 0;
  const { fromIndex, toIndex, slot } = reorder;
  if (index === fromIndex) return (toIndex - fromIndex) * slot;
  if (fromIndex < index && index <= toIndex) return -slot;
  if (toIndex <= index && index < fromIndex) return slot;
  return 0;
}
