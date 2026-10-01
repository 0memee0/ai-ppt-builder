import { deckSchema } from "@/lib/deck/schema";
import type { Deck, Slide } from "@/lib/deck/types";
import type { ChatMessage } from "@/store/types";
import { STORES, isStorageAvailable, withStore } from "./db";

/**
 * A saved project: the deck plus the conversation that produced it, so a
 * reload costs no tokens. `pendingSlideIds` lets an interrupted generation
 * resume after a refresh.
 */
export type DeckRecord = {
  id: string;
  title: string;
  updatedAt: number;
  deck: Deck;
  messages: ChatMessage[];
  pendingSlideIds: string[];
};

/** Listing for the recents view: metadata plus the first slide for a cover thumbnail. */
export type DeckSummary = Pick<DeckRecord, "id" | "title" | "updatedAt"> & {
  slideCount: number;
  themeId: string;
  cover: Slide | null;
};

const LAST_DECK_KEY = "pb:last-deck";

export async function saveDeckRecord(record: Omit<DeckRecord, "updatedAt">): Promise<void> {
  if (!isStorageAvailable()) return;
  const full: DeckRecord = { ...record, updatedAt: Date.now() };
  await withStore(STORES.decks, "readwrite", (s) => s.put(full));
  rememberLastDeck(record.id);
}

/** Validates on the way out so a schema change never crashes the editor. */
export async function loadDeckRecord(id: string): Promise<DeckRecord | null> {
  if (!isStorageAvailable()) return null;
  const raw = await withStore<unknown>(STORES.decks, "readonly", (s) => s.get(id));
  return parseRecord(raw);
}

export async function listDeckRecords(): Promise<DeckSummary[]> {
  if (!isStorageAvailable()) return [];
  const all = await withStore<unknown[]>(STORES.decks, "readonly", (s) => s.getAll());
  return all
    .flatMap((raw) => {
      const r = parseRecord(raw);
      if (!r) return [];
      return [
        {
          id: r.id,
          title: r.title,
          updatedAt: r.updatedAt,
          slideCount: r.deck.slides.length,
          themeId: r.deck.themeId,
          cover: r.deck.slides[0] ?? null,
        },
      ];
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDeckRecord(id: string): Promise<void> {
  if (!isStorageAvailable()) return;
  await withStore(STORES.decks, "readwrite", (s) => s.delete(id));
  if (lastDeckId() === id) localStorage.removeItem(LAST_DECK_KEY);
}

export function lastDeckId(): string | null {
  try {
    return localStorage.getItem(LAST_DECK_KEY);
  } catch {
    return null;
  }
}

export function rememberLastDeck(id: string): void {
  try {
    localStorage.setItem(LAST_DECK_KEY, id);
  } catch {
    /* private mode or quota: the deck still lives in IndexedDB */
  }
}

function parseRecord(raw: unknown): DeckRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<DeckRecord>;
  const deck = deckSchema.safeParse(r.deck);
  if (!deck.success || typeof r.id !== "string") return null;
  return {
    id: r.id,
    title: typeof r.title === "string" ? r.title : deck.data.title,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : deck.data.updatedAt,
    deck: deck.data,
    messages: Array.isArray(r.messages) ? r.messages.map(settleMessage) : [],
    pendingSlideIds: Array.isArray(r.pendingSlideIds) ? r.pendingSlideIds.filter((x) => typeof x === "string") : [],
  };
}

/** A message saved mid-stream can never finish; show it as interrupted. */
function settleMessage(m: ChatMessage): ChatMessage {
  if (m.status !== "streaming") return m;
  return {
    ...m,
    status: "error",
    text: m.text || "Stopped by a page reload. Slides built before that were kept.",
    steps: m.steps?.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)),
  };
}
