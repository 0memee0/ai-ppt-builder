import { EditorShell } from "@/components/editor/EditorShell";

export default async function EditorPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  return <EditorShell deckId={deckId} />;
}
