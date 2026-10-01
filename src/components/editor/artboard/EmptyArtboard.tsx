import { MessageSquareText } from "lucide-react";

type Props = { width: number; height: number };

export function EmptyArtboard({ width, height }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-line-strong bg-white text-center"
      style={{ width, height }}
    >
      <MessageSquareText className="size-6 text-faint" strokeWidth={1.5} />
      <p className="text-base text-ink">Describe the deck in chat.</p>
      <p className="max-w-xs text-sm text-muted">
        Slides will appear here as they are written. You can also add a blank slide and build it by hand.
      </p>
    </div>
  );
}
