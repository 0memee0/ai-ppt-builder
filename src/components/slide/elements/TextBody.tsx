"use client";

import { resolveFontFamily, resolveTextColor } from "@/lib/deck/theme";
import type { TextElement } from "@/lib/deck/types";
import { useTheme } from "../ThemeContext";

export function TextBody({ element }: { element: TextElement }) {
  const theme = useTheme();
  const s = element.style;
  return (
    <div
      className="h-full w-full overflow-hidden whitespace-pre-wrap break-words"
      style={{
        fontFamily: resolveFontFamily(element, theme),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: resolveTextColor(element, theme),
        textAlign: s.align,
        lineHeight: s.lineHeight,
      }}
    >
      {element.text}
    </div>
  );
}
