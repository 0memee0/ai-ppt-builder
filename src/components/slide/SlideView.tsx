"use client";

import { ARTBOARD } from "@/lib/deck/constants";
import { resolveSlideBackground } from "@/lib/deck/theme";
import type { Slide } from "@/lib/deck/types";
import { ElementView } from "./ElementView";
import { useTheme } from "./ThemeContext";

type Props = {
  slide: Slide;
  /** Rendered width in CSS px; the 1920×1080 artboard is scaled to fit. */
  width: number;
  animate?: boolean;
  /** Drawn inside the logical artboard, above the elements. */
  overlay?: React.ReactNode;
  /** Element kept in layout but not painted (the editor draws it instead). */
  hideElementId?: string;
  className?: string;
};

export function SlideView({ slide, width, animate = false, overlay, hideElementId, className }: Props) {
  const theme = useTheme();
  const scale = width / ARTBOARD.w;
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ width, height: ARTBOARD.h * scale }}
    >
      <div
        data-artboard
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: ARTBOARD.w,
          height: ARTBOARD.h,
          background: resolveSlideBackground(slide, theme),
          transform: `scale(${scale})`,
        }}
      >
        {slide.elements.map((element) => (
          <ElementView key={element.id} element={element} animate={animate} hidden={element.id === hideElementId} />
        ))}
        {overlay}
      </div>
    </div>
  );
}
