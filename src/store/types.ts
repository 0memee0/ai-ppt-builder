import type { Deck } from "@/lib/deck/types";

export type ToolStep = {
  id: string;
  label: string;
  status: "done" | "running" | "failed";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: ToolStep[];
  status?: "streaming" | "error";
};

/** One undo step. Full snapshots; see docs/design.md → Notes for the scale path. */
export type HistoryEntry = {
  id: string;
  label: string;
  before: Deck;
  after: Deck;
};

export type AgentStatus = "idle" | "streaming" | "error";
