export const FIELD =
  "rounded-md border border-line bg-white px-2 py-1 text-sm text-ink outline-none focus:border-blue";

export const SECONDARY =
  "rounded-md border border-line-strong bg-white px-2.5 py-1 text-xs font-medium text-ink hover:border-ink";

export const SEGMENT_GROUP = "flex rounded-lg bg-ground p-0.5";

export function segment(active: boolean) {
  return `rounded-md px-3 py-1 text-xs font-medium ${active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`;
}
