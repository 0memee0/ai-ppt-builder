export const SKELETON_KINDS = ["title", "bullets", "chart", "table", "columns"] as const;
export type SkeletonKind = (typeof SKELETON_KINDS)[number];

type BlockSpec = { x: number; y: number; w: number; h: number; alpha: number };

/** Each wireframe as blocks in % of the slide; drawn in reading order so the stagger reads top-down. */
const BLOCKS: Record<SkeletonKind, BlockSpec[]> = {
  title: [
    { x: 16, y: 36, w: 68, h: 13, alpha: 0.6 },
    { x: 28, y: 56, w: 44, h: 6, alpha: 0.3 },
  ],
  bullets: [
    { x: 8, y: 12, w: 56, h: 10, alpha: 0.6 },
    { x: 8, y: 34, w: 70, h: 6, alpha: 0.3 },
    { x: 8, y: 48, w: 62, h: 6, alpha: 0.3 },
    { x: 8, y: 62, w: 66, h: 6, alpha: 0.3 },
  ],
  chart: [
    { x: 8, y: 12, w: 48, h: 10, alpha: 0.6 },
    ...[38, 62, 46, 80, 58].map((h, i) => ({ x: 10 + i * 17, y: 90 - h * 0.7, w: 11, h: h * 0.7, alpha: 0.3 + i * 0.08 })),
  ],
  table: [
    { x: 8, y: 12, w: 52, h: 10, alpha: 0.6 },
    { x: 8, y: 32, w: 84, h: 9, alpha: 0.45 },
    ...[45, 58, 71].map((y) => ({ x: 8, y, w: 84, h: 1.5, alpha: 0.3 })),
    ...[36, 64].map((x) => ({ x, y: 32, w: 1.5, h: 52, alpha: 0.3 })),
  ],
  columns: [
    { x: 8, y: 12, w: 44, h: 10, alpha: 0.6 },
    { x: 8, y: 34, w: 38, h: 6, alpha: 0.3 },
    { x: 54, y: 34, w: 38, h: 6, alpha: 0.3 },
    { x: 8, y: 48, w: 34, h: 6, alpha: 0.3 },
    { x: 54, y: 48, w: 32, h: 6, alpha: 0.3 },
    { x: 54, y: 62, w: 36, h: 6, alpha: 0.3 },
  ],
};

const STAGGER_START_MS = 450;
const STAGGER_STEP_MS = 70;

/**
 * A wireframe slide in one of the real layouts, drawn with blocks in
 * `currentColor`. Fills its parent, so the parent sets the 16:9 box and the
 * tint. With `animate`, blocks settle in one after another after the slide
 * lands. Decorative only.
 */
export function SlideSkeleton({ kind, animate = false }: { kind: SkeletonKind; animate?: boolean }) {
  return (
    <>
      {BLOCKS[kind].map((b, i) => (
        <span
          key={i}
          className={`absolute rounded-[3px] bg-current ${animate ? "block-in" : ""}`}
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.w}%`,
            height: `${b.h}%`,
            ["--alpha" as string]: b.alpha,
            opacity: b.alpha,
            animationDelay: animate ? `${STAGGER_START_MS + i * STAGGER_STEP_MS}ms` : undefined,
          }}
        />
      ))}
    </>
  );
}
