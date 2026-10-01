import type { IdSource } from "@/lib/deck/ids";
import { applyTool } from "@/lib/deck/tools/apply";
import type { ReducerOutcome } from "@/lib/deck/tools/shared";
import type { Deck } from "@/lib/deck/types";

/**
 * Slide budget for a generate turn. Enforced in code on both sides of the
 * wire, not just requested in the prompt, so a runaway plan cannot cost a
 * populate call per extra slide.
 */

export const DEFAULT_SLIDE_COUNT = 5;
export const MAX_SLIDE_COUNT = 12;

/** "a 3 slide deck", "eight slides", "3-slide" → that number, clamped. Otherwise the default. */
export function requestedSlideCount(prompt: string): number {
  const match = prompt.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[\s-]*slides?\b/i);
  if (!match) return DEFAULT_SLIDE_COUNT;
  const raw = match[1].toLowerCase();
  const n = WORDS[raw] ?? Number(raw);
  return Math.min(MAX_SLIDE_COUNT, Math.max(1, n));
}

const WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

export type TurnLimits = { maxSlides?: number };

/**
 * `applyTool` plus the turn's limits. The server runs this in each tool's
 * execute; the client runs it for each mirrored call. Any refusal happens
 * before the reducer, so neither side mints ids the other did not.
 */
export function applyWithLimits(
  deck: Deck,
  name: string,
  args: unknown,
  ids: IdSource,
  limits: TurnLimits,
): ReducerOutcome {
  if (name === "add_slide" && limits.maxSlides !== undefined && deck.slides.length >= limits.maxSlides) {
    return { ok: false, error: `Slide limit reached (${limits.maxSlides}). Do not add more slides.` };
  }
  return applyTool(deck, name, args, ids);
}
