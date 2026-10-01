import type { Frame } from "@/lib/deck/types";
import { ACCENT, type Handle } from "./types";

const POINTS: { handle: Handle; cursor: string }[] = [
  { handle: { fx: 0, fy: 0 }, cursor: "nwse-resize" },
  { handle: { fx: 0.5, fy: 0 }, cursor: "ns-resize" },
  { handle: { fx: 1, fy: 0 }, cursor: "nesw-resize" },
  { handle: { fx: 1, fy: 0.5 }, cursor: "ew-resize" },
  { handle: { fx: 1, fy: 1 }, cursor: "nwse-resize" },
  { handle: { fx: 0.5, fy: 1 }, cursor: "ns-resize" },
  { handle: { fx: 0, fy: 1 }, cursor: "nesw-resize" },
  { handle: { fx: 0, fy: 0.5 }, cursor: "ew-resize" },
];

type Props = {
  frame: Frame;
  /** Converts a desired screen size to logical artboard units. */
  px: (n: number) => number;
  onPointerDown?: (e: React.PointerEvent, handle: Handle) => void;
};

export function Handles({ frame, px, onPointerDown }: Props) {
  const size = px(10);
  return (
    <>
      {POINTS.map(({ handle, cursor }) => (
        <span
          key={`${handle.fx}-${handle.fy}`}
          className="absolute touch-none rounded-[2px] bg-white"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPointerDown?.(e, handle);
          }}
          style={{
            left: frame.x + frame.w * handle.fx - size / 2,
            top: frame.y + frame.h * handle.fy - size / 2,
            width: size,
            height: size,
            border: `${px(1.5)}px solid ${ACCENT}`,
            cursor,
          }}
        />
      ))}
    </>
  );
}
