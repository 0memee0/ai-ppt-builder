import {
  BarChart3,
  BringToFront,
  ChevronLeft,
  ChevronRight,
  Copy,
  ImagePlus,
  SendToBack,
  Shapes,
  Table2,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { InsertKind } from "@/hooks/use-editor-actions";

type Props = {
  hasSelection: boolean;
  /** Z-order buttons only make sense for one element. */
  singleSelection: boolean;
  slideIndex: number;
  slideCount: number;
  /** No active slide, or a model turn is in flight. */
  locked: boolean;
  onInsert: (kind: InsertKind) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onPrev: () => void;
  onNext: () => void;
};

const INSERTS: { kind: InsertKind; label: string; icon: LucideIcon }[] = [
  { kind: "text", label: "Text", icon: Type },
  { kind: "image", label: "Image", icon: ImagePlus },
  { kind: "chart", label: "Chart", icon: BarChart3 },
  { kind: "table", label: "Table", icon: Table2 },
  { kind: "shape", label: "Shape", icon: Shapes },
];

export function Toolbar({
  hasSelection,
  singleSelection,
  slideIndex,
  slideCount,
  locked,
  onInsert,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-panel px-3">
      <div role="group" aria-label="Insert" className="flex items-center gap-0.5">
        {INSERTS.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            disabled={locked}
            onClick={() => onInsert(kind)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink hover:bg-ground disabled:text-faint disabled:hover:bg-transparent"
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {hasSelection && (
        <>
          <span aria-hidden className="mx-2 h-5 w-px bg-line" />
          <div role="group" aria-label="Selection" className="flex items-center gap-0.5">
            <ToolIcon label="Duplicate (⌘D)" disabled={locked} onClick={onDuplicate}>
              <Copy className="size-4" />
            </ToolIcon>
            <ToolIcon label="Bring forward" disabled={locked || !singleSelection} onClick={onBringForward}>
              <BringToFront className="size-4" />
            </ToolIcon>
            <ToolIcon label="Send backward" disabled={locked || !singleSelection} onClick={onSendBackward}>
              <SendToBack className="size-4" />
            </ToolIcon>
            <ToolIcon label="Delete (⌫)" disabled={locked} onClick={onDelete}>
              <Trash2 className="size-4" />
            </ToolIcon>
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-1 text-sm text-muted">
        <ToolIcon label="Previous slide (←)" disabled={slideIndex <= 0} onClick={onPrev}>
          <ChevronLeft className="size-4" />
        </ToolIcon>
        <span className="min-w-12 text-center tabular-nums">
          {slideCount ? `${slideIndex + 1} / ${slideCount}` : "0 / 0"}
        </span>
        <ToolIcon label="Next slide (→)" disabled={slideIndex >= slideCount - 1} onClick={onNext}>
          <ChevronRight className="size-4" />
        </ToolIcon>
      </div>
    </div>
  );
}

function ToolIcon({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md text-ink hover:bg-ground disabled:text-faint disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
