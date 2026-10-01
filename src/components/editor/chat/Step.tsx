import { Check, CircleAlert } from "lucide-react";
import type { ToolStep } from "../types";

export function Step({ step }: { step: ToolStep }) {
  const failed = step.status === "failed";
  return (
    <li className="flex min-w-0 items-start gap-2 text-xs">
      <span className="mt-px flex size-4 shrink-0 items-center justify-center">
        {step.status === "done" && <Check className="size-3.5 text-muted" />}
        {step.status === "running" && <span className="bg-spectrum size-2 animate-pulse rounded-full" />}
        {failed && <CircleAlert className="size-3.5 text-danger" />}
      </span>
      {/* Failures can carry a long reason; keep them to a few wrapped lines and leave the full text on hover. */}
      <span
        title={failed ? step.label : undefined}
        className={`min-w-0 break-words ${failed ? "line-clamp-3 text-muted" : step.status === "running" ? "text-ink" : "text-muted"}`}
      >
        {failed ? <FailedLabel label={step.label} /> : step.label}
      </span>
    </li>
  );
}

/** "Adding content — reason": the action in ink, the reason muted, so the eye lands on what was attempted. */
function FailedLabel({ label }: { label: string }) {
  const i = label.indexOf(" — ");
  if (i === -1) return <>{label}</>;
  return (
    <>
      <span className="text-ink">{label.slice(0, i)} failed</span>
      <span> — {label.slice(i + 3)}</span>
    </>
  );
}
