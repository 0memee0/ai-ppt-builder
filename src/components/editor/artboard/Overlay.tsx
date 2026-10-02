"use client";

import { ARTBOARD } from "@/lib/deck/constants";
import type { Slide } from "@/lib/deck/types";
import { Handles } from "./Handles";
import { frameStyle } from "./shift-elements";
import { TextEditor } from "./TextEditor";
import { ACCENT, GUIDE_COLOR, type DragPreview, type Handle } from "./types";

type Props = {
  /** Slide as displayed, with any drag preview applied. */
  slide: Slide;
  /** Slide as stored, used to draw drag origins. */
  original: Slide;
  scale: number;
  selectedIds: string[];
  onElementPointerDown: (e: React.PointerEvent, elementId: string) => void;
  onHandlePointerDown: (e: React.PointerEvent, handle: Handle) => void;
  drag?: DragPreview;
  editingId?: string | null;
  onEditText: (elementId: string) => void;
  onCommitText: (elementId: string, text: string) => void;
  onCancelText: () => void;
};

/** Hit targets, selection outlines, handles, text editor, and drag feedback drawn in logical units. */
export function Overlay({
  slide,
  original,
  scale,
  selectedIds,
  onElementPointerDown,
  onHandlePointerDown,
  drag,
  editingId,
  onEditText,
  onCommitText,
  onCancelText,
}: Props) {
  const px = (n: number) => n / scale;
  const selected = slide.elements.filter((el) => selectedIds.includes(el.id));
  const single = selected.length === 1 ? selected[0] : null;
  const dragging = new Set(drag && "elementIds" in drag ? drag.elementIds : []);
  const badge = badgeFor(drag, single);
  const editing = slide.elements.find((el) => el.id === editingId);

  return (
    <>
      {slide.elements.map((el) =>
        el.id === editingId ? null : (
          <div
            key={el.id}
            className={`absolute touch-none ${el.locked ? "cursor-default" : "cursor-move"}`}
            style={frameStyle(el.frame)}
            onPointerDown={(e) => onElementPointerDown(e, el.id)}
            onDoubleClick={() => el.type === "text" && !el.locked && onEditText(el.id)}
          />
        ),
      )}

      {editing?.type === "text" && (
        <TextEditor
          key={editing.id}
          element={editing}
          px={px}
          onCommit={(text) => onCommitText(editing.id, text)}
          onCancel={onCancelText}
        />
      )}

      {drag?.kind === "move" &&
        original.elements
          .filter((el) => dragging.has(el.id))
          .map((el) => (
            <div
              key={`origin-${el.id}`}
              className="pointer-events-none absolute"
              style={{ ...frameStyle(el.frame), border: `${px(1.5)}px dashed ${ACCENT}`, opacity: drag.copy ? 0.9 : 0.5 }}
            />
          ))}

      {drag?.kind === "cross" &&
        slide.elements
          .filter((el) => dragging.has(el.id))
          .map((el) => (
            <div
              key={`leaving-${el.id}`}
              className="pointer-events-none absolute flex items-center justify-center"
              style={{
                ...frameStyle(el.frame),
                background: "rgba(255,255,255,0.72)",
                border: `${px(1.5)}px dashed ${ACCENT}`,
              }}
            >
              <span className="rounded-md bg-ink text-white" style={{ fontSize: px(13), padding: `${px(4)}px ${px(10)}px` }}>
                {drag.targetLabel}
              </span>
            </div>
          ))}

      {selected
        .filter((el) => el.id !== editingId)
        .map((el) => (
          <div
            key={`sel-${el.id}`}
            className="pointer-events-none absolute"
            style={{ ...frameStyle(el.frame), outline: `${px(1.5)}px solid ${ACCENT}` }}
          />
        ))}

      {single && !single.locked && !editingId && (!drag || drag.kind === "resize") && (
        <Handles frame={single.frame} px={px} onPointerDown={onHandlePointerDown} />
      )}

      {drag?.kind === "move" &&
        drag.guides.map((g) => (
          <div
            key={`${g.axis}-${g.at}`}
            className="pointer-events-none absolute"
            style={
              g.axis === "x"
                ? { left: g.at - px(0.75), top: 0, width: px(1.5), height: ARTBOARD.h, background: GUIDE_COLOR }
                : { top: g.at - px(0.75), left: 0, height: px(1.5), width: ARTBOARD.w, background: GUIDE_COLOR }
            }
          />
        ))}

      {badge && (
        <span
          className="pointer-events-none absolute whitespace-nowrap rounded-md bg-ink tabular-nums text-white"
          style={{
            left: badge.frame.x,
            top: badge.frame.y + badge.frame.h + px(8),
            fontSize: px(12),
            padding: `${px(3)}px ${px(8)}px`,
          }}
        >
          {badge.text}
        </span>
      )}
    </>
  );
}

function badgeFor(drag: DragPreview | undefined, single: Slide["elements"][number] | null) {
  if (!drag || !single) return null;
  if (drag.kind === "move") return { frame: single.frame, text: `x ${single.frame.x} · y ${single.frame.y}` };
  if (drag.kind === "resize") return { frame: drag.frame, text: `${drag.frame.w} × ${drag.frame.h}` };
  return null;
}
