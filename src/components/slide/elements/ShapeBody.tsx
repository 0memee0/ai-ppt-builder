"use client";

import { resolveShapeColors } from "@/lib/deck/theme";
import type { ShapeElement } from "@/lib/deck/types";
import { useTheme } from "../ThemeContext";

export function ShapeBody({ element }: { element: ShapeElement }) {
  const { fill, stroke } = resolveShapeColors(element, useTheme());

  if (element.shape === "line") {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${element.frame.w} ${element.frame.h}`} preserveAspectRatio="none">
        <line
          x1={0}
          y1={element.frame.h / 2}
          x2={element.frame.w}
          y2={element.frame.h / 2}
          stroke={stroke}
          strokeWidth={Math.max(element.strokeWidth, 2)}
        />
      </svg>
    );
  }

  return (
    <div
      className="h-full w-full"
      style={{
        background: fill,
        border: element.strokeWidth ? `${element.strokeWidth}px solid ${stroke}` : undefined,
        borderRadius: element.shape === "ellipse" ? "50%" : element.radius,
      }}
    />
  );
}
