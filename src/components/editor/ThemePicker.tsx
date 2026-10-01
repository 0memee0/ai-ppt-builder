"use client";

import { Palette } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/deck/theme";

type Props = {
  themeId: string;
  disabled?: boolean;
  onChange: (themeId: ThemeId) => void;
};

/** Deck-wide theme switch. Swatches preview background, text, and accent. */
export function ThemePicker({ themeId, disabled, onChange }: Props) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Deck theme">
      <Palette className="size-4 text-muted" aria-hidden />
      {THEMES.map((t) => {
        const active = t.id === themeId;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.name}
            title={`${t.name}: ${t.description}`}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            className={`relative size-6 overflow-hidden rounded-full border disabled:opacity-40 ${
              active ? "border-ink ring-2 ring-ink/15" : "border-line-strong hover:border-ink"
            }`}
            style={{ background: t.colors.background }}
          >
            <span aria-hidden className="absolute inset-y-0 right-0 w-1/2" style={{ background: t.colors.accent }} />
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-1/2 w-1/2"
              style={{ background: t.colors.text }}
            />
          </button>
        );
      })}
    </div>
  );
}
