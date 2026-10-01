export type IdPrefix = "s" | "el" | "col" | "row" | "deck" | "msg" | "tool" | "req";

export type IdSource = (prefix: IdPrefix) => string;

/** Random ids for interactive edits. */
export const randomIds: IdSource = (prefix) => {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2) + Date.now().toString(16);
  return `${prefix}_${uuid.replace(/-/g, "").slice(0, 10)}`;
};

/**
 * Deterministic ids for a model turn. The server and the client each run the
 * same tool calls in the same order with a source seeded by the same request
 * id, so both sides mint identical ids without shipping decks back and forth.
 */
export function sequentialIds(seed: string): IdSource {
  let n = 0;
  return (prefix) => `${prefix}_${seed}${(n++).toString(36)}`;
}

let active: IdSource = randomIds;

/** Short, prefixed ids. Readable in the model projection and in tool calls. */
export function newId(prefix: IdPrefix): string {
  return active(prefix);
}

/** Runs `fn` with `source` as the id generator. Reducers are synchronous, so no interleaving. */
export function withIds<T>(source: IdSource | undefined, fn: () => T): T {
  if (!source) return fn();
  const previous = active;
  active = source;
  try {
    return fn();
  } finally {
    active = previous;
  }
}
