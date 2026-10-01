const STARTERS = [
  "Create a deck on a Q3 product roadmap, with one chart and one table",
  "A short customer pitch for a payments product",
  "Turn these notes into a brief internal update",
];

export function Starters({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col justify-end gap-4 pb-2">
      <div>
        <p className="text-spectrum text-lg font-semibold">What are we presenting?</p>
        <p className="mt-1 text-sm text-muted">Describe the topic, paste an outline, or start from one of these.</p>
      </div>
      <ul className="space-y-2">
        {STARTERS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-left text-sm text-ink hover:border-line-strong"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
