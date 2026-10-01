"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/slide/ThemeContext";
import { resolveFontFamily, resolveTextColor } from "@/lib/deck/theme";
import type { TextElement } from "@/lib/deck/types";
import { frameStyle } from "./shift-elements";
import { ACCENT } from "./types";

type Props = {
  element: TextElement;
  /** Converts a desired screen size to logical artboard units. */
  px: (n: number) => number;
  onCommit: (text: string) => void;
  onCancel: () => void;
};

/**
 * In-place text editing. A textarea drawn at the element's frame with the
 * element's resolved typography, so what you type is what the slide shows.
 * Blur or ⌘/Ctrl+Enter commits, Escape cancels. Enter inserts a newline.
 */
export function TextEditor({ element, px, onCommit, onCancel }: Props) {
  const theme = useTheme();
  const ref = useRef<HTMLTextAreaElement>(null);
  const done = useRef(false);
  const s = element.style;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    node.select();
  }, []);

  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    const value = ref.current?.value ?? element.text;
    if (commit && value !== element.text) onCommit(value);
    else onCancel();
  };

  return (
    <textarea
      ref={ref}
      aria-label="Edit text"
      defaultValue={element.text}
      spellCheck={false}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          finish(true);
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent outline-none"
      style={{
        ...frameStyle(element.frame),
        fontFamily: resolveFontFamily(element, theme),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: resolveTextColor(element, theme),
        textAlign: s.align,
        lineHeight: s.lineHeight,
        padding: 0,
        border: 0,
        boxShadow: `0 0 0 ${px(1.5)}px ${ACCENT}`,
        caretColor: ACCENT,
      }}
    />
  );
}
