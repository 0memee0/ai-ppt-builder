import type { Frame } from "@/lib/deck/types";

export type { Guide } from "@/lib/deck/snap";
import type { Guide } from "@/lib/deck/snap";

/** Which resize handle is held, as fractions of the frame (0 = left/top, 1 = right/bottom). */
export type Handle = { fx: 0 | 0.5 | 1; fy: 0 | 0.5 | 1 };

export type DragPreview =
  | { kind: "move"; elementIds: string[]; dx: number; dy: number; guides: Guide[]; copy: boolean }
  | { kind: "resize"; elementId: string; frame: Frame }
  | { kind: "cross"; elementIds: string[]; targetSlideId: string; targetLabel: string; copy: boolean };

export type MoveDrag = Extract<DragPreview, { kind: "move" }>;

/** Editor chrome colours (selection, guides). Slide content colours come from the deck theme. */
export const ACCENT = "#2454d6";
export const GUIDE_COLOR = "#e07a3d";
