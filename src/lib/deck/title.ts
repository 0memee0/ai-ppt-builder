const MAX_WORDS = 7;

/** "please create a ...", "can you make me a ...", "I need a ..." */
const LEAD_IN =
  /^(?:please\s+)?(?:(?:can|could|would)\s+you\s+(?:please\s+)?)?(?:create|make|build|generate|write|design|prepare|draft|put together|give me|i need|i want|i'd like|help me (?:with|make|build|create))\s+/i;
const ARTICLE = /^(?:me\s+)?(?:a|an|the|some)\s+/i;
const COUNT = /^(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)[-\s]slides?\s+/i;
/** "presentation about X" → "X"; "pitch for X" stays, since "pitch" says something. */
const GENERIC_NOUN =
  /^(?:(?:presentation|slide deck|slideshow|deck|ppt|slides)\s+)?(?:about|on|for|covering|explaining|regarding|introducing|that explains?|that covers?)\s+/i;
/** First clause only: before punctuation, a slide count, or a trailing specification. */
const CLAUSE_END =
  /[.;:!?\n]|,\s*(?:with|including|that|which|and|in)?\b|\s+(?:with|including)\s+(?:a|an|one|two|\d+)\b|\s+(?:in\s+)?\d+\s+slides?\b/;

/**
 * A working title from the user's first prompt, so a new deck never shows as
 * "Untitled". Heuristic on purpose: it costs no model call and the user can
 * rename in the top bar. "A 6-slide pitch for a payments product, with one
 * chart" → "Pitch for a payments product".
 */
export function titleFromPrompt(prompt: string): string {
  let s = prompt.trim().replace(/\s+/g, " ");
  s = s.replace(LEAD_IN, "").replace(ARTICLE, "").replace(COUNT, "").replace(ARTICLE, "").replace(GENERIC_NOUN, "");
  s = s.split(CLAUSE_END)[0] ?? "";
  const words = s.split(" ").filter(Boolean).slice(0, MAX_WORDS);
  if (words.length === 0) return "";
  const title = words.join(" ").replace(/[,\s]+$/, "");
  return title.charAt(0).toUpperCase() + title.slice(1);
}
