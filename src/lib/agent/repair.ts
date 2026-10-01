import type { ToolCallRepairFunction, ToolSet } from "ai";

/**
 * Some models serialize nested arguments as JSON strings:
 *   { "frame": "{\"x\": 120, ...}", "rows": "[[...]]" }
 * Zod then rejects every nested field and the model tends to repeat the same
 * mistake on the next step, burning the step budget. This unwraps any string
 * that itself parses to an object or array, recursively, before validation.
 * Returns null when nothing changed so the SDK reports the original error.
 */
export const repairToolCall: ToolCallRepairFunction<ToolSet> = async ({ toolCall, error }) => {
  if (error.name === "AI_NoSuchToolError") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(toolCall.input);
  } catch {
    return null;
  }

  const { value, changed } = unwrap(parsed);
  return changed ? { ...toolCall, input: JSON.stringify(value) } : null;
};

function unwrap(value: unknown): { value: unknown; changed: boolean } {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const inner = JSON.parse(trimmed);
        if (inner !== null && typeof inner === "object") return { value: unwrap(inner).value, changed: true };
      } catch {
        /* a plain string that happens to look like JSON */
      }
    }
    return { value, changed: false };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item) => {
      const r = unwrap(item);
      changed ||= r.changed;
      return r.value;
    });
    return { value: items, changed };
  }

  if (value !== null && typeof value === "object") {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const r = unwrap(v);
      changed ||= r.changed;
      out[k] = r.value;
    }
    return { value: out, changed };
  }

  return { value, changed: false };
}
