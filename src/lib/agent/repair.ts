import type { ToolCallRepairFunction, ToolSet } from "ai";

/**
 * Two mistakes models make with arguments, both of which Zod rejects and the
 * model then repeats on the next step, burning the step budget:
 *
 *   - nested values serialized as JSON strings:
 *       { "frame": "{\"x\": 120, ...}", "rows": "[[...]]" }
 *   - numbers sent as strings under numeric keys:
 *       { "zIndex": "1", "frame": { "x": "120" } }
 *
 * This unwraps any string that parses to an object or array, and turns
 * numeric strings into numbers where the schema wants a number, recursively,
 * before validation. Returns null when nothing changed so the SDK reports
 * the original error.
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

/** Keys whose values are numbers in every tool schema. Table cells and text stay strings. */
const NUMERIC_KEYS = new Set([
  "x", "y", "w", "h", "rotation",
  "zIndex", "index", "toIndex",
  "fontSize", "fontWeight", "lineHeight",
  "strokeWidth", "radius",
]);

/** Chart `series[].values` is the one numeric array. */
const NUMERIC_LIST_KEYS = new Set(["values"]);

const NUMERIC = /^-?\d+(\.\d+)?$/;

function unwrap(value: unknown, key?: string): { value: unknown; changed: boolean } {
  if (typeof value === "string" && key !== undefined && NUMERIC_KEYS.has(key) && NUMERIC.test(value.trim())) {
    return { value: Number(value), changed: true };
  }

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
    const numeric = key !== undefined && NUMERIC_LIST_KEYS.has(key);
    const items = value.map((item) => {
      if (numeric && typeof item === "string" && NUMERIC.test(item.trim())) {
        changed = true;
        return Number(item);
      }
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
      const r = unwrap(v, k);
      changed ||= r.changed;
      out[k] = r.value;
    }
    return { value: out, changed };
  }

  return { value, changed: false };
}
