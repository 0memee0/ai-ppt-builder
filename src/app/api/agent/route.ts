import { stepCountIs, streamText, type ModelMessage } from "ai";
import { DEFAULT_SLIDE_COUNT } from "@/lib/agent/limits";
import { systemPrompt } from "@/lib/agent/prompts";
import { agentRequestSchema, type AgentEvent, type AgentRequest } from "@/lib/agent/protocol";
import { AgentConfigError, getModel, MAX_OUTPUT_TOKENS } from "@/lib/agent/provider";
import { repairToolCall } from "@/lib/agent/repair";
import { createServerTools, createToolSession } from "@/lib/agent/server-tools";
import { PHASE_TOOLS, type ToolResult } from "@/lib/deck/tools/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Model round-trips allowed per phase. A step can carry many tool calls.
 * Plan is a single step: with toolChoice "required" every extra step would be
 * forced to add more slides.
 */
const MAX_STEPS = { plan: 1, populate: 4, refine: 8 } as const;

/** Opt-in: when the model answers a "required" tool choice with prose, nudge it once. */
const RETRY_ON_TEXT = process.env.AGENT_RETRY_ON_TEXT === "1";

const NUDGE =
  "Do not reply in text. You have no live data and that is fine: use plausible, clearly illustrative figures and call the tools now. Mention the assumption in your final summary.";

/**
 * POST /api/agent — one phase of a turn, streamed back as NDJSON AgentEvents.
 * The client owns the deck and the phase sequence; this handler is stateless.
 */
export async function POST(request: Request): Promise<Response> {
  let req: AgentRequest;
  try {
    const parsed = agentRequestSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid request", issues: parsed.error.issues }, 400);
    req = parsed.data;
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  if (req.phase === "populate") {
    if (!req.slideId) return json({ error: "populate needs slideId" }, 400);
    if (!req.deck.slides.some((s) => s.id === req.slideId)) return json({ error: "slideId not in deck" }, 400);
  }

  let model: ReturnType<typeof getModel>;
  try {
    model = getModel();
  } catch (error) {
    const message = error instanceof AgentConfigError ? error.message : "Model provider failed to initialize";
    return json({ error: message }, 500);
  }

  const limits = req.phase === "plan" ? { maxSlides: req.maxSlides ?? DEFAULT_SLIDE_COUNT } : {};
  const session = createToolSession(req.deck, limits);
  const tools = createServerTools(session, req.requestId);
  const messages: ModelMessage[] = req.messages.map((m) => ({ role: m.role, content: m.content }));

  const run = (turn: ModelMessage[]) =>
    streamText({
      model,
      system: systemPrompt(req),
      messages: turn,
      tools,
      activeTools: [...PHASE_TOOLS[req.phase]],
      toolChoice: req.phase === "plan" ? "required" : "auto",
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      stopWhen: stepCountIs(MAX_STEPS[req.phase]),
      repairToolCall,
      abortSignal: request.signal,
    });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      /** Streams one model run. Returns the violation if the model ignored a required tool choice, else null. */
      const pump = async (turn: ModelMessage[]): Promise<Refusal | null> => {
        for await (const part of run(turn).fullStream) {
          switch (part.type) {
            case "text-delta":
              send({ type: "text", delta: part.text });
              break;
            case "tool-call":
              send({ type: "tool-call", toolCallId: part.toolCallId, name: part.toolName, args: part.input });
              break;
            case "tool-result":
              send({ type: "tool-result", toolCallId: part.toolCallId, result: part.output as ToolResult });
              break;
            case "tool-error":
              send({
                type: "tool-result",
                toolCallId: part.toolCallId,
                result: { ok: false, error: describeToolError(part.error, part.toolName) },
              });
              break;
            case "error": {
              const refusal = toolChoiceRefusal(part.error);
              if (refusal !== null) return refusal;
              send({ type: "error", message: describe(part.error) });
              break;
            }
            case "finish":
              send({ type: "finish", reason: part.finishReason });
              break;
          }
        }
        return null;
      };

      try {
        let refusal = await pump(messages);
        if (refusal !== null && !refusal.truncated && RETRY_ON_TEXT && session.calls.length === 0) {
          // One nudge, only when the model chose prose and nothing landed.
          // Not for truncation: the same budget would run out again.
          refusal = await pump([
            ...messages,
            { role: "assistant", content: refusal.text || "(no tool calls)" },
            { role: "user", content: NUDGE },
          ]);
        }
        if (refusal !== null) send({ type: "error", message: refusalMessage(refusal) });
      } catch (error) {
        send({ type: "error", message: describe(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

interface Refusal {
  /** What the model said instead of calling a tool; empty when it said nothing. */
  text: string;
  /** finishReason "length": the output budget ran out (usually spent on hidden reasoning). */
  truncated: boolean;
}

/**
 * AI_ToolChoiceViolationError: the model finished without the required tool
 * call. Returns what it said and whether it was cut off; null for any other
 * error. The class is not exported from `ai`, so this matches on shape.
 */
function toolChoiceRefusal(error: unknown): Refusal | null {
  if (!error || typeof error !== "object") return null;
  const e = error as {
    name?: string;
    finishReason?: string;
    content?: Array<{ type?: string; text?: string }>;
  };
  if (e.name !== "AI_ToolChoiceViolationError") return null;
  const text = (e.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("")
    .trim();
  return { text, truncated: e.finishReason === "length" };
}

function refusalMessage({ text, truncated }: Refusal): string {
  if (truncated) {
    return "The model ran out of output budget before it produced any slides (it spent it thinking). Try again, or narrow the topic.";
  }
  return text
    ? `The model replied instead of building slides: “${text}” Try rephrasing with the content you want.`
    : "The model returned nothing to build. Try rephrasing with the content you want.";
}

/**
 * A tool call the SDK could not validate arrives as a chain of wrapped errors
 * ending in a Zod error. Surface the field-level issues (what the model
 * actually got wrong) rather than the SDK's class names and echoed JSON.
 */
function describeToolError(error: unknown, toolName: string): string {
  for (let e = error as { cause?: unknown; issues?: unknown } | undefined, depth = 0; e && depth < 6; e = e.cause as typeof e, depth++) {
    if (Array.isArray(e.issues) && e.issues.length) {
      const list = e.issues as { path?: (string | number)[]; message?: string }[];
      const issues = list.slice(0, 3).map((i) => `${i.path?.length ? `${i.path.join(".")}: ` : ""}${i.message ?? "invalid"}`);
      // The one mistake that recurs: asking add_element for a chart.
      const hint = toolName === "add_element" && list.some((i) => i.path?.[0] === "type") ? " Charts are created with add_chart." : "";
      return `invalid arguments: ${issues.join("; ")}.${hint}`;
    }
  }
  return describe(error).replace(/^AI_\w+:\s*/, "").split("\n")[0].slice(0, 240);
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
