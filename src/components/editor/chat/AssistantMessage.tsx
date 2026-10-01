import { CircleAlert, Play, RotateCcw } from "lucide-react";
import type { ChatMessage } from "../types";
import { Step } from "./Step";
import { WorkingCard } from "./WorkingCard";

type Props = {
  message: ChatMessage;
  onRetry: () => void;
  /** "Continue" when outlines are waiting to be filled, otherwise "Try again". */
  retryLabel: string;
  /** Only the latest failed reply offers the action; older ones are history. */
  canRetry: boolean;
};

export function AssistantMessage({ message, onRetry, retryLabel, canRetry }: Props) {
  const streaming = message.status === "streaming";
  const failed = message.status === "error";

  return (
    <div className="space-y-2.5">
      {message.steps && message.steps.length > 0 && (
        <ol className="space-y-1.5 rounded-lg border border-line bg-white p-2.5">
          {message.steps.map((step) => (
            <Step key={step.id} step={step} />
          ))}
        </ol>
      )}

      {streaming && <WorkingCard message={message} />}

      {failed ? (
        <div className="rounded-lg border border-danger/25 bg-danger/5 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-medium text-danger">
            <CircleAlert className="size-4" />
            {message.text.startsWith("Stopped") ? "Stopped early" : "That reply did not finish"}
          </p>
          <p className="mt-1 text-ink">{message.text}</p>
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 flex items-center gap-1.5 rounded-md border border-line-strong bg-white px-2.5 py-1 text-xs font-medium hover:border-ink"
            >
              {retryLabel === "Continue" ? <Play className="size-3.5" /> : <RotateCcw className="size-3.5" />}
              {retryLabel}
            </button>
          )}
        </div>
      ) : (
        message.text && <p className="text-sm leading-relaxed text-ink">{message.text}</p>
      )}
    </div>
  );
}
