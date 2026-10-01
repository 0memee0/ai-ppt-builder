"use client";

import { useEffect, useRef, useState } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue"> & {
  value: string;
  /** Called on blur or Enter, only when the text changed. */
  onCommit: (value: string) => void;
};

/**
 * Text field that edits locally and writes once. Blur or Enter commits when
 * the value differs from the deck; Escape reverts. One commit is one undo
 * step, so typing never floods history.
 */
export function CommitField({ value, onCommit, ...rest }: Props) {
  const [draft, setDraft] = useState(value);
  // Guards against Enter + the blur it triggers committing twice.
  const committed = useRef<string | null>(null);
  useEffect(() => {
    setDraft(value);
    committed.current = null;
  }, [value]);

  const commit = () => {
    if (draft === value || draft === committed.current) return;
    committed.current = draft;
    onCommit(draft);
  };

  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
        rest.onKeyDown?.(e);
      }}
    />
  );
}
