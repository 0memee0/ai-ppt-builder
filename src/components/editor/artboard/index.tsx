"use client";

import { SlideView } from "@/components/slide/SlideView";
import { useFitScale } from "@/hooks/use-fit-scale";
import type { Slide } from "@/lib/deck/types";
import { EmptyArtboard } from "./EmptyArtboard";
import { Overlay } from "./Overlay";
import { applyPreview } from "./shift-elements";
import type { DragPreview, Handle } from "./types";

export type { DragPreview, Guide, Handle } from "./types";

const PADDING = 48;

type Props = {
  slide: Slide | null;
  selectedIds: string[];
  onClear: () => void;
  onElementPointerDown: (e: React.PointerEvent, elementId: string) => void;
  onHandlePointerDown: (e: React.PointerEvent, handle: Handle) => void;
  drag?: DragPreview;
  /** Text element being edited in place. */
  editingId?: string | null;
  onEditText: (elementId: string) => void;
  onCommitText: (elementId: string, text: string) => void;
  onCancelText: () => void;
};

export function Artboard({
  slide,
  selectedIds,
  onClear,
  onElementPointerDown,
  onHandlePointerDown,
  drag,
  editingId,
  onEditText,
  onCommitText,
  onCancelText,
}: Props) {
  const { ref, width, height, scale } = useFitScale<HTMLDivElement>(PADDING);
  const display = slide ? applyPreview(slide, drag) : null;

  return (
    <div
      ref={ref}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      onPointerDown={onClear}
    >
      {width > 0 && display && slide && (
        <div className="rounded-sm shadow-[0_1px_2px_rgba(22,22,22,0.06),0_8px_32px_rgba(22,22,22,0.08)]">
          <SlideView
            slide={display}
            width={width}
            animate={!drag}
            hideElementId={editingId ?? undefined}
            overlay={
              <Overlay
                slide={display}
                original={slide}
                scale={scale}
                selectedIds={selectedIds}
                onElementPointerDown={onElementPointerDown}
                onHandlePointerDown={onHandlePointerDown}
                drag={drag}
                editingId={editingId}
                onEditText={onEditText}
                onCommitText={onCommitText}
                onCancelText={onCancelText}
              />
            }
          />
        </div>
      )}

      {width > 0 && !display && <EmptyArtboard width={width} height={height} />}
    </div>
  );
}
