"use client";

import { ArrowUp } from "lucide-react";
import { useState, type RefObject } from "react";
import { DEFAULT_SLIDE_COUNT, MAX_SLIDE_COUNT } from "@/lib/agent/limits";

const STARTERS = [
  "A 6-slide pitch for a payments product, with one chart and one table",
  "Q3 product roadmap for the leadership team",
  "Onboarding guide for new engineers, 5 slides",
  "The history of chai in India, for a school class",
];

type Props = {
  onCreate: (prompt: string) => void;
  /** Fires as the draft goes between empty and non-empty. */
  onDraftChange?: (hasText: boolean) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
};

/** The prompt box with a row of starter prompts under it; a starter fills the box, it does not submit. */
export function PromptForm({ onCreate, onDraftChange, textareaRef, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const prompt = value.trim();

  const update = (next: string) => {
    if (next.trim().length > 0 !== value.trim().length > 0) onDraftChange?.(next.trim().length > 0);
    setValue(next);
  };

  const submit = () => {
    if (!prompt || disabled) return;
    onCreate(prompt);
  };

  return (
    <form
      className="text-left"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="rounded-2xl border border-line bg-panel p-3 shadow-[0_1px_2px_rgba(22,22,22,0.04),0_12px_40px_rgba(22,22,22,0.06)] focus-within:border-line-strong">
        <textarea
          ref={textareaRef}
          autoFocus
          rows={3}
          value={value}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Describe the presentation you need…"
          aria-label="Describe your presentation"
          className="w-full resize-none bg-transparent px-2 py-1 text-base text-ink outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-2">
          <p className="text-xs text-faint">
            {DEFAULT_SLIDE_COUNT} slides unless you say otherwise, up to {MAX_SLIDE_COUNT}. Enter to create.
          </p>
          <button
            type="submit"
            disabled={!prompt || disabled}
            className="bg-spectrum flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Create deck
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>

      <ul aria-label="Example prompts" className="mt-4 flex flex-wrap justify-center gap-2">
        {STARTERS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => {
                update(s);
                textareaRef?.current?.focus();
              }}
              className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </form>
  );
}
