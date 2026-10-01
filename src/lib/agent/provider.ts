import { createSarvam } from "sarvam-ai-sdk";

/**
 * Server only. The key comes from the environment and never reaches the
 * client. Model id is overridable so a cheaper model can be swapped in.
 */

export const DEFAULT_MODEL = "sarvam-105b";

/**
 * Explicit output budget. Without it the API applies a small default and a
 * reasoning model can spend all of it thinking, finishing with reason
 * "length" and no tool call. 4096 is the starter-plan ceiling for sarvam-105b.
 */
export const MAX_OUTPUT_TOKENS = 4096;

const REASONING_EFFORTS = ["none", "low", "medium", "high"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

function reasoningEffort(): ReasoningEffort {
  const raw = process.env.SARVAM_REASONING;
  return (REASONING_EFFORTS as readonly string[]).includes(raw ?? "") ? (raw as ReasoningEffort) : "low";
}

export function getModel() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new AgentConfigError("SARVAM_API_KEY is not set. Copy .env.example to .env.local and add your key.");
  }
  const sarvam = createSarvam({ apiKey });
  return sarvam(process.env.SARVAM_MODEL ?? DEFAULT_MODEL, { reasoning_effort: reasoningEffort() });
}

export class AgentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentConfigError";
  }
}
