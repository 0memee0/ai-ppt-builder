export function UserBubble({ text }: { text: string }) {
  return (
    <div className="ml-8 rounded-xl rounded-br-sm bg-ink px-3.5 py-2.5 text-sm leading-relaxed text-white">
      {text}
    </div>
  );
}
