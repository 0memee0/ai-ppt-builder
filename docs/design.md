# Design

One editor. A print view. No controller logic here — screens, how people move through them, and where state lives.

The product is **Presentation Builder** for now. The mark is a small blue-to-orange block, not the Sarvam wordmark or logomark.

Chrome is a warm off-white ground (`#f4f1ec`), near-black type (`#161616`), and white artboards. The spectrum (`#2454d6` → `#e07a3d`) is only for the primary send action, the streaming line, the selection box, and alignment guides. Slide content uses the deck theme, which starts as near-black text on white.

Desktop only. The shell needs room for a filmstrip, a 16:9 artboard, and chat side by side.

## Screens

### Editor

This is the product. Every other “screen” below is a state of this layout.

```text
┌──────────────────────────────────────────────────────────────────┐
│  mark    Deck title                         Undo  Redo  Export   │
├────────────┬─────────────────────────────────────┬───────────────┤
│            │  Text  Image  Chart  Table  Shape   │               │
│  Slides    │  ┌───────────────────────────────┐  │  Chat         │
│            │  │                               │  │               │
│  1  thumb  │  │         16:9 artboard         │  │  transcript   │
│  2  thumb  │  │                               │  │               │
│  3  thumb  │  └───────────────────────────────┘  │               │
│            │  inspector, only when needed        │  composer     │
│  + slide   │                                     │               │
└────────────┴─────────────────────────────────────┴───────────────┘
```

| Region    | What it shows                               | What it changes                                                                                       |
| --------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Top bar   | Deck title, undo, redo, export              | Title text. Undo and redo restore a snapshot. Export opens print.                                     |
| Filmstrip | One thumbnail per slide, 16:9, index, title | Click sets the active slide. Drag reorders. A thumbnail is a drop target while an element is dragged. |
| Toolbar   | Insert text, image, chart, table, shape     | Inserts on the active slide and selects the new element.                                              |
| Artboard  | The active slide’s elements, scaled to fit  | Select, type, drag, resize.                                                                           |
| Inspector | Only for a chart, table, or image selection | Data, type, alt text, replace image. Text is edited on the artboard.                                  |
| Chat      | Transcript and composer                     | Sends a prompt. Shows tool summaries as they land.                                                    |

The filmstrip title is the text of the element with role `title`, or “Untitled”.

Undo and redo are disabled while a model turn is in flight. Export stays available.

### Empty

No slides. The artboard is a blank 16:9 with the line “Describe the deck in chat.” The filmstrip has a single “Add slide” control. Chat is focused and offers three starter prompts:

- Create a deck on a Q3 product roadmap, with one chart and one table
- A short customer pitch for a payments product
- Turn these notes into a brief internal update

Sending a starter is the same as sending typed text.

### Generating

The user message is already in the transcript. Under it, a streaming line names the latest tool in plain language (“Adding slide 3 — Pricing”, “Placing the revenue chart”).

Slides appear in the filmstrip as the outline lands. The first new slide becomes active. Elements appear on the artboard as each slide is filled. Thumbnails redraw from the same elements.

The toolbar and filmstrip drop targets ignore mutation attempts. Clicking a thumbnail still changes the active slide, so the user can watch another slide fill.

### Element selected

A 1px selection box and eight resize handles. No rotate handle. Shift-click adds to the selection. A marquee on empty artboard selects every element it intersects. Dragging one selected element moves the whole selection.

The toolbar shows Duplicate, Delete, Bring forward, and Send backward once something is selected. Delete and Duplicate also live on the keyboard (Backspace, ⌘/Ctrl+D).

### Inspector

Opens under the artboard when the selection is a single chart, table, or image.

| Selection | Inspector                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------- |
| Chart     | Title, type (bar, line, pie, area), a data grid of categories and series, legend and grid toggles |
| Table     | Header row and body cells                                                                         |
| Image     | Alt text, fit (cover or contain), Replace, which opens a file picker                              |

Changing chart type keeps the grid. Editing a cell commits when the cell blurs.

### Drag

| Gesture              | What the user sees                                                                                                                                                  | On drop                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Move on the artboard | The element follows the pointer. Guides appear when an edge or center lines up with a sibling or the artboard center. Position snaps by 8px in the 1920×1080 space. | Frame updates. Selection stays.                                                                                         |
| Resize               | The handle follows the pointer. The opposite corner stays fixed. Size snaps by 8px.                                                                                 | Frame updates.                                                                                                          |
| Reorder slides       | A horizontal line between thumbnails shows the insertion index.                                                                                                     | Slide order updates. The dragged slide stays active.                                                                    |
| Cross-slide          | The filmstrip thumbnail under the pointer gets a spectrum outline.                                                                                                  | The element’s parent becomes that slide. The view follows it: that slide becomes active and the element stays selected. |
| Option held          | The same gestures. The ghost is labeled “Copy”.                                                                                                                     | A new element lands on the target. The original stays.                                                                  |
| Escape               | The ghost disappears.                                                                                                                                               | Nothing is written.                                                                                                     |

A drop that would hang off the artboard is clamped inside it. The drop still completes.

### Error

The streaming line is replaced by the failure, in the transcript, next to the user message that caused it. The deck is back to the moment before that message. The composer is usable. The artboard is editable again.

If the deck has slides and the failure happened on a later message, those slides are still there. Empty-state copy is only for zero slides.

### Print

A separate view, opened by Export. No filmstrip, toolbar, or chat. Slides stack vertically, each a 16:9 page with its elements, charts, tables, and images. The browser print dialog is the PDF path. Speaker notes are not on the page.

## Flows

### Open

1. Load the last project, or start an empty one.
2. Land on Empty or on the editor with the last active slide.
3. Undo history is empty after a refresh. The deck and the transcript are not.

### Generate

1. User sends a prompt from Empty or from a deck that already has slides.
2. The message is appended. A snapshot of the deck is held for this turn.
3. Outline tools add slides. The filmstrip grows. The first new slide is shown.
4. Each new slide is filled in order. Elements show up on the artboard if that slide is active.
5. The turn commits one undo step labeled from the prompt.
6. The assistant posts a short summary. The streaming line clears.

### Refine

Same as generate, with the full tool set. The streaming line names each patch (“Updating the title on slide 3”). One undo step covers the whole reply. Slides the user already arranged stay put except where a tool wrote.

### Edit by hand

1. Click a thumbnail or use the arrow keys to change slides. This is not an undo step.
2. Click an element. Type on the artboard, or edit the inspector.
3. Blur commits one undo step if the value changed.
4. Drag or resize. The deck changes only on pointer-up, as one undo step.
5. Insert, duplicate, delete, reorder, or z-order. Each is one undo step.

### Undo

1. The deck returns to the snapshot before the last gesture or the last chat message.
2. If the active slide no longer exists, the view moves to the nearest remaining slide.
3. Selection drops any id that is gone.

## State

Two kinds of state. The **project** is the document. The **session** is how the user is looking at it right now.

```text
Project (saved)                         Session (memory)
┌─────────────────────────┐             ┌──────────────────────────┐
│ deck                    │             │ activeSlideId            │
│   slides, elements      │◄────────────│ selectedElementIds       │
│ messages                │             │ history (snapshots)      │
└─────────────────────────┘             │ gesture (drag preview)   │
                                        │ agent (idle/streaming/   │
Assets (saved, by id)                   │        error)            │
┌─────────────────────────┐             └──────────────────────────┘
│ image blobs             │
└─────────────────────────┘
```

The deck is the only copy of the slides. Chat, the artboard, the filmstrip, undo, and print all read it. Image bytes live beside the deck, under an id the image element points at.

History stores full deck snapshots, capped at 50, and is not saved. A later patch log replaces the inside of the history entries only. See the note at the end.

### Who writes the deck

| Source                                         | When it writes                                                                                            | History                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Model tools                                    | As each tool lands during a turn                                                                          | One entry for the whole message, on success  |
| Artboard typing, inspector cells, chart fields | On blur, if the value changed                                                                             | One entry                                    |
| Drag, resize, reorder, cross-slide drop        | On pointer-up                                                                                             | One entry                                    |
| Insert, duplicate, delete, z-order, retitle    | On the action                                                                                             | One entry                                    |
| Interrupted or failed model turn               | Keeps every tool call that landed; slides planned but not filled stay marked pending and can be continued | One entry if anything landed, otherwise none |

Clicking a thumbnail, changing selection, and moving the pointer during a drag do not write the deck and do not write history. The drag preview lives in `gesture` until pointer-up or Escape.

### Who reads

| Surface   | Reads                                                                |
| --------- | -------------------------------------------------------------------- |
| Artboard  | Active slide, selection, gesture preview                             |
| Filmstrip | Slide order, titles, active slide, gesture drop target               |
| Inspector | The single selected element                                          |
| Chat      | Messages, agent status                                               |
| Model     | A projection of the deck at the start of the turn, then tool results |
| Print     | The deck only                                                        |
| Save      | The project, after the deck or the transcript changes                |

During a model turn the user can change the active slide. User writes wait until the turn commits or rolls back. Undo and redo wait with them.

Arrow keys change slides only when focus is not in a text box, a cell, or the composer.

### A turn, as state

```text
send
  → append user message
  → hold deck snapshot
  → agent = streaming
  → each tool applies to the deck
  → artboard and filmstrip render the same deck
success
  → push { before, after }
  → append assistant summary
  → agent = idle
failure or stop
  → keep the deck as it is (each tool call was atomic)
  → push { before, after } if anything landed
  → append error with progress ("3 of 5 slides have content")
  → offer Continue for pending slides, Undo to discard
  → agent = idle
```

### A drag, as state

```text
pointer down on an element
  → gesture = { kind, origins, pointer }
pointer move
  → gesture.pointer updates
  → artboard draws origins + delta, plus guides
  → deck is unchanged
pointer up
  → commit the final frames or the new parent slide
  → clear gesture
escape
  → clear gesture
```

Option at pointer-up copies. The original element is untouched.

## Notes

- History is full snapshots in memory. The scale path is a patch list inside the same history entry. Do not build that for this deadline.
- Themes, present mode, a project dashboard, element lock, grouping, and speaker-notes UI are reserved in the schema and absent from these screens.
- The model projection is a single function. v1 can send a short deck in full. A larger deck later sends ids, titles, and layouts for every slide, and full elements only for the slides the user is talking about.
