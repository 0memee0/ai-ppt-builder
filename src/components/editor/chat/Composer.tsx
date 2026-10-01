"use client";

import { useState } from "react";
import { ArrowUp, Square } from "lucide-react";

type Props = {
  busy: boolean;
  autoFocus: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function Composer({ busy, autoFocus, onSend, onStop }: Props) {
  const [draft, setDraft] = useState("");
  const canSend = !busy && draft.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <form
      className="border-t border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="rounded-xl border border-line-strong bg-white focus-within:border-ink">
        <textarea
          rows={3}
          autoFocus={autoFocus}
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={busy ? "Working on your deck…" : "Ask for a deck, or a change to this one"}
          className="block w-full resize-none rounded-xl bg-transparent px-3 pt-2.5 text-sm outline-none placeholder:text-faint disabled:text-muted"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="pl-1 text-xs text-faint">Enter to send · Shift+Enter for a new line</span>
          {busy ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={onStop}
              className="flex size-8 items-center justify-center rounded-lg bg-ink text-white"
            >
              <Square className="size-3 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send"
              disabled={!canSend}
              className="bg-spectrum flex size-8 items-center justify-center rounded-lg text-white disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
