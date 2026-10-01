type Props = { title: string; children: React.ReactNode };

export function InspectorHeader({ title, children }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-4 py-3">
      <h2 className="mr-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </div>
  );
}
