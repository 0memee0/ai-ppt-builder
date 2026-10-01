import type { Frame, Slide, SlideElement } from "@/lib/deck/types";
import type { DragPreview } from "./types";

/** Returns the slide as it should display mid-gesture: moved or resized elements, nothing committed. */
export function applyPreview(slide: Slide, drag: DragPreview | undefined): Slide {
  if (!drag || drag.kind === "cross") return slide;
  if (drag.kind === "resize") {
    return {
      ...slide,
      elements: slide.elements.map((el) => (el.id === drag.elementId ? ({ ...el, frame: drag.frame } as SlideElement) : el)),
    };
  }
  const ids = new Set(drag.elementIds);
  return {
    ...slide,
    elements: slide.elements.map((el) =>
      ids.has(el.id)
        ? ({ ...el, frame: { ...el.frame, x: el.frame.x + drag.dx, y: el.frame.y + drag.dy } } as SlideElement)
        : el,
    ),
  };
}

export function frameStyle(frame: Frame): React.CSSProperties {
  return { left: frame.x, top: frame.y, width: frame.w, height: frame.h };
}
