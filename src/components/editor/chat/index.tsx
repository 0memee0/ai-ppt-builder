"use client";

import { useEffect } from "react";
import { useAgentTurn } from "@/hooks/use-agent-turn";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { takeQueuedPrompt } from "@/lib/storage/queued-prompt";
import { useDeckStore } from "@/store/deck-store";
import { useIsBusy, useMessages, usePendingSlideIds } from "@/store/selectors";
import { AssistantMessage } from "./AssistantMessage";
import { Composer } from "./Composer";
import { Starters } from "./Starters";
import { UserBubble } from "./UserBubble";

type Props = {
  /** False while the deck is still being restored; a queued prompt waits for it. */
  ready: boolean;
};

export function ChatPanel({ ready }: Props) {
  const messages = useMessages();
  const busy = useIsBusy();
  const pending = usePendingSlideIds();
  const { send, stop, retry } = useAgentTurn();
  const scrollRef = useAutoScroll<HTMLDivElement>(messages);

  // Prompt handed over from the landing page: send once, after the deck has loaded.
  const deckId = useDeckStore((s) => s.deck.id);
  useEffect(() => {
    if (!ready || busy) return;
    const queued = takeQueuedPrompt(deckId);
    if (queued) void send(queued);
  }, [ready, busy, deckId, send]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const retryLabel = pending.size > 0 ? "Continue" : "Try again";

  return (
    <aside aria-label="Chat" className="flex w-[22rem] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex h-12 shrink-0 items-center border-b border-line px-4">
        <h2 className="text-sm font-medium">Chat</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <Starters onPick={send} />
        ) : (
          <ol className="space-y-5">
            {messages.map((m) => (
              <li key={m.id}>
                {m.role === "user" ? (
                  <UserBubble text={m.text} />
                ) : (
                  <AssistantMessage
                    message={m}
                    onRetry={retry}
                    retryLabel={retryLabel}
                    canRetry={m.id === lastAssistantId && !busy}
                  />
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <Composer busy={busy} autoFocus={messages.length === 0} onSend={send} onStop={stop} />
    </aside>
  );
}
