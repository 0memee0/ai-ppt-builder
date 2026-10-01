"use client";

import { Projector } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useRecentDecks } from "@/hooks/use-recent-decks";
import { titleFromPrompt } from "@/lib/deck/title";
import { emptyDeck } from "@/lib/deck/tools/slides";
import { saveDeckRecord } from "@/lib/storage/decks";
import { queuePrompt } from "@/lib/storage/queued-prompt";
import { Greeting } from "./Greeting";
import { PromptForm } from "./PromptForm";
import { QuickActions } from "./QuickActions";
import { RecentDecks } from "./RecentDecks";

/**
 * Start screen, one column: greeting, the prompt box with starters, two
 * quick ways in, then the decks saved in this browser as a shelf of tiles.
 * A prompt creates a deck, titled from the prompt, and hands the prompt to
 * the editor, which sends it once the deck is loaded.
 */
export function Landing() {
  const router = useRouter();
  const [typing, setTyping] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recent = useRecentDecks();

  const create = useCallback(
    async (prompt: string | null) => {
      setLeaving(true);
      const deck = emptyDeck(prompt ? titleFromPrompt(prompt) : "");
      await saveDeckRecord({ id: deck.id, title: deck.title, deck, messages: [], pendingSlideIds: [] });
      if (prompt) queuePrompt(deck.id, prompt);
      router.push(`/editor/${deck.id}`);
    },
    [router],
  );

  const last = recent.state.kind === "ready" ? (recent.state.decks[0] ?? null) : null;

  return (
    <div className="min-h-screen bg-ground">
      <header className="reveal mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-6">
        <span aria-hidden className="bg-spectrum flex size-6 items-center justify-center rounded-[6px]">
          <Projector className="size-3.5 text-white" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Presentation Builder</span>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="mx-auto max-w-3xl pt-16 text-center">
          <div className="reveal" style={{ animationDelay: "80ms" }}>
            <Greeting paused={typing} />
          </div>
          <p className="reveal mx-auto mt-2 max-w-md text-sm text-faint" style={{ animationDelay: "160ms" }}>
            Describe it and a first draft lands in seconds. Refine it in chat, or straight on the slides.
          </p>
          <div className="reveal mt-8" style={{ animationDelay: "260ms" }}>
            <PromptForm
              textareaRef={textarea}
              disabled={leaving}
              onCreate={(prompt) => void create(prompt)}
              onDraftChange={setTyping}
            />
          </div>
          <div className="reveal mt-8" style={{ animationDelay: "360ms" }}>
            <QuickActions onBlank={() => void create(null)} disabled={leaving} last={last} />
          </div>
        </section>

        <section className="reveal mt-20" style={{ animationDelay: "480ms" }}>
          <RecentDecks
            state={recent.state}
            onDelete={(id) => void recent.remove(id)}
            onNew={() => textarea.current?.focus()}
            paused={typing}
          />
        </section>
      </main>
    </div>
  );
}
