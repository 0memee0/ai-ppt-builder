const INK = "#161616";
const PAPER = "#ffffff";

/**
 * Ink or white, whichever reads better on `background`. Accepts #rgb, #rrggbb,
 * and #rrggbbaa. Anything else (named colours, gradients) falls back to ink.
 */
export function contrastText(background: string): string {
  const rgb = parseHex(background);
  if (!rgb) return INK;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? INK : PAPER;
}

function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, "");
  if (hex.length === 3) {
    const [r, g, b] = hex.split("").map((c) => parseInt(c + c, 16));
    return Number.isNaN(r + g + b) ? null : [r, g, b];
  }
  if (hex.length === 6 || hex.length === 8) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return Number.isNaN(r + g + b) ? null : [r, g, b];
  }
  return null;
}
