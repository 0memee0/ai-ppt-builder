"use client";

import { useCallback, useRef } from "react";
import { DEFAULT_SLIDE_COUNT, requestedSlideCount, type TurnLimits } from "@/lib/agent/limits";
import { parseAgentEvent, type AgentEvent, type AgentRequest, type ChatTurn } from "@/lib/agent/protocol";
import { newId, sequentialIds } from "@/lib/deck/ids";
import { slideTitle } from "@/lib/deck/constants";
import type { ToolName } from "@/lib/deck/tools/schemas";
import { useDeckStore } from "@/store/deck-store";
import type { ChatMessage, ToolStep } from "@/store/types";

/**
 * One chat message, end to end. The client owns the phase sequence:
 *
 *   empty deck   → plan, then populate each new slide in order
 *   existing deck → refine
 *
 * Each phase is one POST to /api/agent. Every streamed tool call is mirrored
 * through the store with the same seeded id source the server used, so the
 * client deck matches the server's request-local copy without shipping decks
 * back. The turn commits one undo entry whether it finished or was cut short;
 * slides the plan created but never filled stay marked pending so a later
 * Continue can finish them without re-planning.
 */

const MAX_CONTEXT_TURNS = 12;

export function useAgentTurn() {
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Shared turn wrapper. Whatever the body applied stays in the deck, even on
   * failure or Stop: tool calls are atomic, so the deck is always valid, and
   * the work is committed as one undo entry the user can discard. Only a turn
   * that applied nothing is rolled back.
   */
  const runTurn = useCallback(async (label: string, body: (ctx: TurnContext) => Promise<string>) => {
    const store = useDeckStore.getState();
    if (store.agent.status === "streaming") return;

    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = newId("msg");
    store.appendMessage({ id: assistantId, role: "assistant", text: "", steps: [], status: "streaming" });
    store.beginTurn();
    const before = store.deck;
    const ui = messageUpdater(assistantId);

    try {
      const summary = await body({ ui, signal: controller.signal });
      useDeckStore.getState().commitTurn(label);
      ui.update((m) => ({ ...m, status: undefined, text: summary }));
    } catch (error) {
      const state = useDeckStore.getState();
      const changed = state.deck !== before;
      if (changed) state.commitTurn(label);
      else state.rollbackTurn();

      const reason = controller.signal.aborted ? "Stopped." : describe(error);
      ui.update((m) => ({
        ...m,
        status: "error",
        text: `${reason} ${progressNote(changed)}`.trim(),
        steps: m.steps?.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)),
      }));
    } finally {
      abortRef.current = null;
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      const store = useDeckStore.getState();
      if (!prompt || store.agent.status === "streaming") return;

      const messages: ChatTurn[] = [...transcript(store.messages), { role: "user", content: prompt }];
      store.appendMessage({ id: newId("msg"), role: "user", text: prompt });

      const generating = store.deck.slides.length === 0;
      await runTurn(truncate(prompt), async ({ ui, signal }) => {
        if (!generating) {
          const finish = await runPhase({ phase: "refine", messages }, ui, signal);
          const reply = useDeckStore.getState().messages.find((m) => m.id === ui.id);
          const text = reply?.text.trim() ?? "";
          const applied = reply?.steps?.filter((s) => s.status === "done").length ?? 0;
          // A reply with neither words nor tool calls would render as nothing at all.
          if (!text && applied === 0) {
            throw new Error(
              finish === "length"
                ? "The model used its whole output budget thinking and never got to a change. Try a more specific request, like “add a shape accent and an image to slide 1”."
                : "The model returned nothing for that request. Try rephrasing it.",
            );
          }
          return text || `Applied ${applied} change${applied === 1 ? "" : "s"}.`;
        }

        const maxSlides = requestedSlideCount(prompt);
        const before = new Set(store.deck.slides.map((s) => s.id));
        await runPhase({ phase: "plan", messages, maxSlides }, ui, signal);

        const created = useDeckStore
          .getState()
          .deck.slides.filter((s) => !before.has(s.id))
          .slice(0, maxSlides)
          .map((s) => s.id);
        if (created.length === 0) throw new Error("The model did not add any slides.");
        useDeckStore.getState().setActiveSlide(created[0]);
        useDeckStore.getState().setPendingSlides(created);

        await populatePending(messages, ui, signal);
        return summarize(created.length);
      });
    },
    [runTurn],
  );

  /** Fills the slides an interrupted generate left as outlines. */
  const resume = useCallback(async () => {
    const store = useDeckStore.getState();
    const lastPrompt = [...store.messages].reverse().find((m) => m.role === "user")?.text ?? "";
    const messages: ChatTurn[] = [...transcript(store.messages), { role: "user", content: lastPrompt }];
    const count = pendingIds().length;

    await runTurn("Continue generating", async ({ ui, signal }) => {
      await populatePending(messages, ui, signal);
      return `Finished the remaining ${count} slide${count === 1 ? "" : "s"}. Ask for changes, or edit on the canvas.`;
    });
  }, [runTurn]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  /** Continue if outlines are waiting, otherwise resend the last prompt. */
  const retry = useCallback(() => {
    if (pendingIds().length > 0) return void resume();
    const last = [...useDeckStore.getState().messages].reverse().find((m) => m.role === "user");
    if (last) void send(last.text);
  }, [resume, send]);

  return { send, stop, retry, resume };
}

type TurnContext = { ui: MessageUpdater; signal: AbortSignal };

/** Populates each pending slide in order, clearing it from the pending list as it lands. */
async function populatePending(messages: ChatTurn[], ui: MessageUpdater, signal: AbortSignal) {
  for (const slideId of pendingIds()) {
    await runPhase({ phase: "populate", slideId, messages }, ui, signal);
    const store = useDeckStore.getState();
    store.setPendingSlides(store.agent.pendingSlideIds.filter((id) => id !== slideId));
  }
}

/** Pending ids that still exist in the deck (undo or delete may have removed some). */
function pendingIds(): string[] {
  const { deck, agent } = useDeckStore.getState();
  const present = new Set(deck.slides.map((s) => s.id));
  return agent.pendingSlideIds.filter((id) => present.has(id));
}

function progressNote(changed: boolean): string {
  const pending = pendingIds().length;
  if (pending > 0) {
    const total = useDeckStore.getState().deck.slides.length;
    return `${total - pending} of ${total} slides have content; ${pending} ${pending === 1 ? "is" : "are"} still an outline. Continue to finish them, or Undo to discard.`;
  }
  return changed ? "The changes made so far are kept; Undo reverts them." : "Nothing was changed.";
}

function truncate(text: string): string {
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

/* ── one phase ─────────────────────────────────────────────────────────── */

type PhaseInput = Pick<AgentRequest, "phase" | "messages" | "slideId" | "maxSlides">;

/** Streams one phase into the message. Resolves with the model's finish reason, if it reported one. */
async function runPhase(input: PhaseInput, ui: MessageUpdater, signal: AbortSignal): Promise<string | undefined> {
  const requestId = newId("req").slice(4);
  const ids = sequentialIds(requestId);
  // Same limits the server applies, so both sides refuse the same calls.
  const limits: TurnLimits = input.phase === "plan" ? { maxSlides: input.maxSlides ?? DEFAULT_SLIDE_COUNT } : {};
  const body: AgentRequest = { requestId, deck: useDeckStore.getState().deck, ...input };

  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `The model request failed (${res.status}).`);
  }

  let phaseText = "";
  let finishReason: string | undefined;
  const handle = (event: AgentEvent | null) => {
    if (!event) return;
    switch (event.type) {
      case "tool-call": {
        ui.addStep({ id: event.toolCallId, label: pendingLabel(event.name), status: "running" });
        const out = useDeckStore.getState().applyAgentTool(event.name, event.args, ids, limits);
        if (!out.ok) console.warn(`[agent] client mirror rejected ${event.name}: ${out.error}`);
        break;
      }
      case "tool-result":
        ui.updateStep(event.toolCallId, (s) =>
          event.result.ok
            ? { ...s, label: event.result.summary, status: "done" }
            : { ...s, label: `${s.label} — ${event.result.error}`, status: "failed" },
        );
        break;
      case "text":
        phaseText += event.delta;
        ui.setText(phaseText);
        break;
      case "error":
        throw new Error(event.message);
      case "finish":
        finishReason = event.reason;
        break;
    }
  };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) handle(parseAgentEvent(line));
  }
  if (buffer.trim()) handle(parseAgentEvent(buffer));
  return finishReason;
}

/* ── message plumbing ──────────────────────────────────────────────────── */

type MessageUpdater = ReturnType<typeof messageUpdater>;

function messageUpdater(id: string) {
  const update = (fn: (m: ChatMessage) => ChatMessage) => useDeckStore.getState().updateMessage(id, fn);
  return {
    id,
    update,
    addStep: (step: ToolStep) => update((m) => ({ ...m, steps: [...(m.steps ?? []), step] })),
    updateStep: (stepId: string, fn: (s: ToolStep) => ToolStep) =>
      update((m) => ({ ...m, steps: m.steps?.map((s) => (s.id === stepId ? fn(s) : s)) })),
    /** Streaming text for the current phase. Replaces, so each phase starts clean. */
    setText: (text: string) => update((m) => ({ ...m, text })),
  };
}

/** Prior turns as plain text, most recent last. Failed replies are skipped. */
function transcript(messages: ChatMessage[]): ChatTurn[] {
  return messages
    .filter((m) => m.text.trim() && m.status !== "error" && m.status !== "streaming")
    .slice(-MAX_CONTEXT_TURNS)
    .map((m) => ({ role: m.role, content: m.text }));
}

function summarize(count: number): string {
  const titles = useDeckStore
    .getState()
    .deck.slides.slice(0, 3)
    .map((s) => slideTitle(s));
  return `Built ${count} slide${count === 1 ? "" : "s"}: ${titles.join(", ")}${count > 3 ? ", …" : ""}. Ask for changes, or edit on the canvas.`;
}

const PENDING: Record<ToolName, string> = {
  add_slide: "Adding a slide",
  update_slide: "Updating a slide",
  change_layout: "Changing a layout",
  delete_slide: "Removing a slide",
  reorder_slides: "Reordering slides",
  duplicate_slide: "Duplicating a slide",
  set_theme: "Switching theme",
  add_element: "Adding content",
  update_element: "Updating an element",
  delete_element: "Removing an element",
  move_element: "Moving an element",
  resize_element: "Resizing an element",
  reorder_elements: "Changing stacking order",
  add_chart: "Adding a chart",
  update_chart_data: "Updating chart data",
  change_chart_type: "Changing chart type",
};

function pendingLabel(name: string): string {
  return (PENDING as Record<string, string>)[name] ?? `Running ${name}`;
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong talking to the model.";
}
