"use client";

import { Coffee, Moon, Sun, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

/** The question changes every so often; a handful of ways to ask the same thing. */
const QUESTIONS = [
  "What's going on the big screen?",
  "Got a room to win over?",
  "One idea, a handful of slides. What's the idea?",
  "What should the team see first thing tomorrow?",
  "Teaching something? Pitching something?",
  "Tell me the story. I'll find the slides.",
];

const ROTATE_MS = 6000;

type Daypart = { label: string; Icon: typeof Sun };

function daypart(hour: number): Daypart {
  if (hour >= 5 && hour < 12) return { label: "Good morning", Icon: Coffee };
  if (hour >= 12 && hour < 17) return { label: "Good afternoon", Icon: Sun };
  if (hour >= 17 && hour < 22) return { label: "Good evening", Icon: Sunset };
  return { label: "Working late?", Icon: Moon };
}

/**
 * The hero copy: a quiet greeting for the time of day, then one question
 * that gently rotates. `paused` (the user is typing) holds the current one.
 * The hour is read on the client so the server render never disagrees.
 */
export function Greeting({ paused }: { paused: boolean }) {
  const [hour, setHour] = useState<number | null>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % QUESTIONS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const part = hour === null ? null : daypart(hour);

  return (
    <div className="flex flex-col items-center gap-3">
      <p
        className="flex items-center gap-2 text-sm text-muted transition-opacity duration-500"
        style={{ opacity: part ? 1 : 0 }}
        aria-hidden={!part}
      >
        {part && <part.Icon className="size-4 text-orange" strokeWidth={1.75} />}
        {part?.label ?? "\u00a0"}
      </p>
      {/* Fixed height so the question can change without the page shifting. */}
      <h1 className="relative h-[2.6em] w-full text-3xl font-medium tracking-tight text-ink sm:h-[1.3em]" aria-live="polite">
        <span key={i} className="reveal absolute inset-x-0 top-0 text-balance">
          {QUESTIONS[i]}
        </span>
      </h1>
    </div>
  );
}
