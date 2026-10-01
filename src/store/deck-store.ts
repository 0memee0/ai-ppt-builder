"use client";

import { create } from "zustand";
import { applyWithLimits, type TurnLimits } from "@/lib/agent/limits";
import { newId, type IdSource } from "@/lib/deck/ids";
import { applyTool, type ReducerOutcome } from "@/lib/deck/tools/apply";
import type { ToolArgs, ToolName } from "@/lib/deck/tools/schemas";
import { emptyDeck } from "@/lib/deck/tools/slides";
import type { Deck } from "@/lib/deck/types";
import type { AgentStatus, ChatMessage, HistoryEntry } from "./types";

const HISTORY_CAP = 50;

/**
 * The one canonical deck. Chat, canvas, filmstrip, undo, and export all read
 * and write here. Every deck write goes through `applyTool` (the same reducers
 * the model uses) or `commit` (pointer gestures that already hold a new deck).
 */

type ToolCall = { [N in ToolName]: { name: N; args: ToolArgs<N> } }[ToolName];

export type DeckState = {
  /* project */
  deck: Deck;
  messages: ChatMessage[];

  /* session */
  activeSlideId: string | null;
  selectedElementIds: string[];
  history: { entries: HistoryEntry[]; index: number };
  agent: {
    status: AgentStatus;
    snapshot: Deck | null;
    /** Slides the plan created that have not been populated yet. Survives an interrupted turn so it can be resumed. */
    pendingSlideIds: string[];
  };

  /* deck writes */
  run: <N extends ToolName>(name: N, args: ToolArgs<N>) => ReducerOutcome;
  runBatch: (label: string, calls: ToolCall[]) => ReducerOutcome[];
  commit: (label: string, next: Deck) => void;
  setTitle: (title: string) => void;
  /** Replaces the project (deck and, when given, its chat). Clears history and selection. */
  loadDeck: (deck: Deck, messages?: ChatMessage[]) => void;

  /* history */
  undo: () => void;
  redo: () => void;

  /* selection and navigation */
  setActiveSlide: (slideId: string | null) => void;
  stepSlide: (delta: 1 | -1) => void;
  select: (elementIds: string[]) => void;
  toggleSelect: (elementId: string) => void;
  clearSelection: () => void;

  /* agent turn: writes bypass the busy lock and commit as one history entry */
  beginTurn: () => void;
  /** Mirrors a streamed tool call. `ids` and `limits` must match the request's. */
  applyAgentTool: (name: string, rawArgs: unknown, ids: IdSource, limits: TurnLimits) => ReducerOutcome;
  commitTurn: (label: string) => void;
  rollbackTurn: () => void;
  setAgentStatus: (status: AgentStatus) => void;
  setPendingSlides: (slideIds: string[]) => void;

  /* chat transcript */
  appendMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage> | ((m: ChatMessage) => ChatMessage)) => void;
};

const initialDeck = emptyDeck();

export const useDeckStore = create<DeckState>()((set, get) => {
  /** Applies a new deck plus a history entry, then reconciles session ids. */
  const write = (label: string, next: Deck) => {
    const { deck, history } = get();
    if (next === deck) return;
    const entry: HistoryEntry = { id: newId("tool"), label, before: deck, after: next };
    const kept = history.entries.slice(0, history.index + 1);
    const entries = [...kept, entry].slice(-HISTORY_CAP);
    set(reconcile({ ...get(), deck: next, history: { entries, index: entries.length - 1 } }));
  };

  return {
    deck: initialDeck,
    messages: [],
    activeSlideId: initialDeck.slides[0]?.id ?? null,
    selectedElementIds: [],
    history: { entries: [], index: -1 },
    agent: { status: "idle", snapshot: null, pendingSlideIds: [] },

    run: (name, args) => {
      if (get().agent.status === "streaming") return { ok: false, error: "A model turn is in progress" };
      const out = applyTool(get().deck, name, args);
      if (out.ok) write(out.result.summary, out.deck);
      return out;
    },

    runBatch: (label, calls) => {
      if (get().agent.status === "streaming") return calls.map(() => ({ ok: false, error: "A model turn is in progress" }));
      let deck = get().deck;
      const outcomes = calls.map((call) => {
        const out = applyTool(deck, call.name, call.args);
        if (out.ok) deck = out.deck;
        return out;
      });
      write(label, deck);
      return outcomes;
    },

    commit: (label, next) => {
      if (get().agent.status === "streaming") return;
      write(label, next);
    },

    setTitle: (title) => {
      const { deck } = get();
      if (title === deck.title) return;
      write("Rename deck", { ...deck, title, updatedAt: Date.now() });
    },

    loadDeck: (deck, messages) =>
      set(
        reconcile({
          ...get(),
          deck,
          ...(messages && { messages }),
          activeSlideId: deck.slides[0]?.id ?? null,
          selectedElementIds: [],
          history: { entries: [], index: -1 },
          agent: { status: "idle", snapshot: null, pendingSlideIds: [] },
        }),
      ),

    undo: () => {
      const { history, agent } = get();
      if (agent.status === "streaming" || history.index < 0) return;
      const entry = history.entries[history.index];
      set(reconcile({ ...get(), deck: entry.before, history: { ...history, index: history.index - 1 } }));
    },

    redo: () => {
      const { history, agent } = get();
      if (agent.status === "streaming" || history.index >= history.entries.length - 1) return;
      const entry = history.entries[history.index + 1];
      set(reconcile({ ...get(), deck: entry.after, history: { ...history, index: history.index + 1 } }));
    },

    setActiveSlide: (slideId) => set({ activeSlideId: slideId, selectedElementIds: [] }),

    stepSlide: (delta) => {
      const { deck, activeSlideId } = get();
      const index = deck.slides.findIndex((s) => s.id === activeSlideId);
      const next = deck.slides[index + delta];
      if (next) set({ activeSlideId: next.id, selectedElementIds: [] });
    },

    select: (elementIds) => set({ selectedElementIds: elementIds }),

    toggleSelect: (elementId) =>
      set(({ selectedElementIds }) => ({
        selectedElementIds: selectedElementIds.includes(elementId)
          ? selectedElementIds.filter((id) => id !== elementId)
          : [...selectedElementIds, elementId],
      })),

    clearSelection: () => set({ selectedElementIds: [] }),

    beginTurn: () => set(({ agent }) => ({ agent: { ...agent, status: "streaming", snapshot: get().deck } })),

    applyAgentTool: (name, rawArgs, ids, limits) => {
      const out = applyWithLimits(get().deck, name, rawArgs, ids, limits);
      if (out.ok) set(reconcile({ ...get(), deck: out.deck }));
      return out;
    },

    commitTurn: (label) => {
      const { agent, deck, history } = get();
      if (agent.snapshot && agent.snapshot !== deck) {
        const entry: HistoryEntry = { id: newId("tool"), label, before: agent.snapshot, after: deck };
        const kept = history.entries.slice(0, history.index + 1);
        const entries = [...kept, entry].slice(-HISTORY_CAP);
        set({ history: { entries, index: entries.length - 1 } });
      }
      set(({ agent }) => ({ agent: { ...agent, status: "idle", snapshot: null } }));
    },

    rollbackTurn: () => {
      const { agent } = get();
      const deck = agent.snapshot ?? get().deck;
      set(reconcile({ ...get(), deck, agent: { ...agent, status: "error", snapshot: null } }));
    },

    setAgentStatus: (status) => set(({ agent }) => ({ agent: { ...agent, status } })),

    setPendingSlides: (slideIds) => set(({ agent }) => ({ agent: { ...agent, pendingSlideIds: slideIds } })),

    appendMessage: (message) => set(({ messages }) => ({ messages: [...messages, message] })),

    updateMessage: (id, patch) =>
      set(({ messages }) => ({
        messages: messages.map((m) => (m.id === id ? (typeof patch === "function" ? patch(m) : { ...m, ...patch }) : m)),
      })),
  };
});

/**
 * After any deck change: keep the active slide valid (fall back to the nearest
 * remaining one) and drop selected ids that no longer exist on it.
 */
function reconcile(state: DeckState): DeckState {
  const { deck } = state;
  let activeSlideId = state.activeSlideId;

  if (!deck.slides.some((s) => s.id === activeSlideId)) {
    activeSlideId = deck.slides[0]?.id ?? null;
  }
  const slide = deck.slides.find((s) => s.id === activeSlideId);
  const present = new Set(slide?.elements.map((el) => el.id) ?? []);
  const selectedElementIds = state.selectedElementIds.filter((id) => present.has(id));

  return { ...state, activeSlideId, selectedElementIds };
}
