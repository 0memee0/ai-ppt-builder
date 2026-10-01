import Link from "next/link";
import { Download, Projector, Redo2, Undo2 } from "lucide-react";
import type { SaveStatus } from "@/hooks/use-deck-persistence";
import type { ThemeId } from "@/lib/deck/theme";
import { ThemePicker } from "./ThemePicker";

type Props = {
  deckTitle: string;
  onRename: (title: string) => void;
  themeId: string;
  onTheme?: (themeId: ThemeId) => void;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
};

const SAVE_LABEL: Record<SaveStatus, string> = {
  restoring: "Restoring…",
  saving: "Saving…",
  saved: "Saved",
  error: "Not saved",
};

export function TopBar({ deckTitle, onRename, themeId, onTheme, saveStatus, canUndo, canRedo, undo, redo }: Props) {
  return (
    <header className="flex h-13 shrink-0 items-center gap-4 border-b border-line bg-panel px-4">
      <Link href="/" className="flex items-center gap-2.5 rounded-md py-1 pr-2 hover:bg-ground" title="All decks">
        <span aria-hidden className="bg-spectrum flex size-5 items-center justify-center rounded-[5px]">
          <Projector className="size-3 text-white" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Presentation Builder</span>
      </Link>

      <span aria-hidden className="h-5 w-px bg-line" />

      <input
        key={deckTitle}
        aria-label="Deck title"
        defaultValue={deckTitle}
        onBlur={(e) => onRename(e.currentTarget.value.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = deckTitle;
            e.currentTarget.blur();
          }
        }}
        placeholder="Untitled deck"
        className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm text-ink outline-none placeholder:text-faint hover:bg-ground focus:bg-ground"
      />

      <span
        role="status"
        aria-live="polite"
        className={`text-xs ${saveStatus === "error" ? "text-danger" : "text-faint"}`}
        title="Saved in this browser (IndexedDB)"
      >
        {SAVE_LABEL[saveStatus]}
      </span>

      <ThemePicker themeId={themeId} disabled={!onTheme} onChange={(id) => onTheme?.(id)} />

      <span aria-hidden className="h-5 w-px bg-line" />

      <div className="flex items-center gap-1">
        <IconButton label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={undo}>
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton label="Redo" shortcut="⇧⌘Z" disabled={!canRedo} onClick={redo}>
          <Redo2 className="size-4" />
        </IconButton>
      </div>

      <Link
        href="/print"
        className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-sm font-medium hover:border-ink"
      >
        <Download className="size-4" />
        Export
      </Link>
    </header>
  );
}

function IconButton({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={`${label} (${shortcut})`}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md text-ink hover:bg-ground disabled:text-faint disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
