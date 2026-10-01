import { z } from "zod";
import { deckSchema } from "@/lib/deck/schema";
import type { ToolResult } from "@/lib/deck/tools/schemas";
import { MAX_SLIDE_COUNT } from "./limits";

/**
 * The wire contract between the editor and /api/agent. The server holds no
 * deck between requests: the client sends the current deck, the server
 * projects it for the model and runs tools against a request-local copy.
 */

export const phaseSchema = z.enum(["plan", "populate", "refine"]);

export const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const agentRequestSchema = z.object({
  /** Seeds id minting on both sides. Fresh per request. */
  requestId: z.string().min(1),
  phase: phaseSchema,
  deck: deckSchema,
  /** Transcript so far, most recent last. The last entry is the user's ask. */
  messages: z.array(chatTurnSchema).min(1),
  /** Populate only: the slide to fill. */
  slideId: z.string().optional(),
  /** Plan only: hard cap on slides this turn may create. */
  maxSlides: z.number().int().min(1).max(MAX_SLIDE_COUNT).optional(),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type ChatTurn = z.infer<typeof chatTurnSchema>;

/** One line of the NDJSON response stream. */
export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool-call"; toolCallId: string; name: string; args: unknown }
  | { type: "tool-result"; toolCallId: string; result: ToolResult }
  | { type: "finish"; reason: string }
  | { type: "error"; message: string };

export function parseAgentEvent(line: string): AgentEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as AgentEvent;
  } catch {
    return null;
  }
}
