type Props = { label: string; on: boolean; onChange: (on: boolean) => void };

export function Toggle({ label, on, onChange }: Props) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-ink">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="size-3.5 accent-blue" />
      {label}
    </label>
  );
}
