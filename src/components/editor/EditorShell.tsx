"use client";

import { useState } from "react";
import { useDeckPersistence } from "@/hooks/use-deck-persistence";
import { useDragGesture } from "@/hooks/use-drag-gesture";
import { useEditorActions } from "@/hooks/use-editor-actions";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { useSlideReorder } from "@/hooks/use-slide-reorder";
import {
  useActiveSlide,
  useDeckActions,
  useHistory,
  useIsBusy,
  usePendingSlideIds,
  useSelectedElements,
  useSelectedIds,
  useSlides,
} from "@/store/selectors";
import { useDeckStore } from "@/store/deck-store";
import { ThemeProvider } from "@/components/slide/ThemeContext";
import { getTheme } from "@/lib/deck/theme";
import { Artboard } from "./artboard";
import { ChatPanel } from "./chat";
import { Filmstrip } from "./filmstrip";
import { Inspector, hasInspector } from "./inspector";
import { Toolbar } from "./Toolbar";
import { TopBar } from "./TopBar";

export function EditorShell({ deckId }: { deckId: string }) {
  const title = useDeckStore((s) => s.deck.title);
  const themeId = useDeckStore((s) => s.deck.themeId);
  const run = useDeckStore((s) => s.run);
  const slides = useSlides();
  const { slide, index: slideIndex } = useActiveSlide();
  const selectedIds = useSelectedIds();
  const selected = useSelectedElements();
  const busy = useIsBusy();
  const pendingIds = usePendingSlideIds();
  const history = useHistory();
  const { setTitle, setActiveSlide, stepSlide, clearSelection } = useDeckActions();
  const actions = useEditorActions();
  const { drag, onElementPointerDown, onHandlePointerDown } = useDragGesture(!busy);
  const { reorder, onThumbnailPointerDown } = useSlideReorder(!busy);
  const [editingId, setEditingId] = useState<string | null>(null);
  const saveStatus = useDeckPersistence(deckId);
  useEditorShortcuts(actions);

  const commitText = (elementId: string, text: string) => {
    if (slide) run("update_element", { slideId: slide.id, elementId, text });
    setEditingId(null);
  };

  const inspected = selected.length === 1 && hasInspector(selected[0]) ? selected[0] : null;

  return (
    <ThemeProvider theme={getTheme(themeId)}>
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar
        deckTitle={title}
        onRename={setTitle}
        themeId={themeId}
        onTheme={busy ? undefined : (id) => run("set_theme", { themeId: id })}
        saveStatus={saveStatus}
        {...history}
      />

      <div className="flex min-h-0 flex-1">
        <Filmstrip
          slides={slides}
          activeSlideId={slide?.id ?? null}
          onSelect={setActiveSlide}
          onAdd={busy ? undefined : actions.addSlide}
          pendingIds={pendingIds}
          dropTargetId={drag?.kind === "cross" ? drag.targetSlideId : undefined}
          dropLabel={drag?.kind === "cross" ? drag.targetLabel : undefined}
          reorder={reorder}
          onThumbnailPointerDown={onThumbnailPointerDown}
          onDuplicate={busy ? undefined : actions.duplicateSlide}
          onDelete={busy ? undefined : actions.deleteSlide}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <Toolbar
            hasSelection={selected.length > 0}
            singleSelection={selected.length === 1}
            slideIndex={slideIndex}
            slideCount={slides.length}
            locked={busy || !slide}
            onInsert={actions.insert}
            onDuplicate={actions.duplicateSelection}
            onDelete={actions.deleteSelection}
            onBringForward={() => actions.shiftZ(1)}
            onSendBackward={() => actions.shiftZ(-1)}
            onPrev={() => stepSlide(-1)}
            onNext={() => stepSlide(1)}
          />
          <Artboard
            slide={slide}
            selectedIds={selectedIds}
            onClear={clearSelection}
            onElementPointerDown={onElementPointerDown}
            onHandlePointerDown={onHandlePointerDown}
            drag={drag}
            editingId={busy ? null : editingId}
            onEditText={setEditingId}
            onCommitText={commitText}
            onCancelText={() => setEditingId(null)}
          />
          {inspected && <Inspector element={inspected} />}
        </main>

        <ChatPanel ready={saveStatus !== "restoring"} />
      </div>
    </div>
    </ThemeProvider>
  );
}
