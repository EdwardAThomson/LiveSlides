# Visual Slide Editor — Design & Implementation Plan

_Status: proposal · 2026-06-05_

## 1. Why

The current authoring path (MDX / code) has too much friction for the things a
visual tool does instantly — **dropping in an image, placing a text box, drawing
a box with a border**. In practice it's faster to reach for Google Slides. AI
help has also underwhelmed, partly because the AI emits MDX *prose* and can't do
visual layout.

The goal is **not** a Google Slides clone. It's to remove the friction that
pushes us back to GSlides, while keeping the things GSlides can't do
(AI-generated decks in our own format, the presenter/stage/camera-overlay
recording stack, and — eventually — live embeds). A structured, free-form
**canvas slide** does both: it's drag-and-drop to edit *and* clean JSON that an
AI can generate and a human can nudge.

### Goals
- Free-form **positioning power**: move / resize / **rotate** / z-order, precise
  coordinates.
- Low-friction **image import** (drag-drop / paste / file picker).
- First-class **text boxes**, **borders**, and **shapes** (rect / ellipse / line).
- Stay **AI-friendly**: the slide is plain JSON the AI can author and edit.
- **Coexist** with MDX slides — mix both in one deck.

### Non-goals (for now)
- Website-as-iframe embedding — most sites block framing (X-Frame-Options/CSP),
  so it's unreliable. YouTube/video/local-app embeds come later as an element
  type, not a headline.
- Full GSlides parity (animations per element, transitions, comments, real-time
  collaboration).
- Round-tripping the visual model *back* into MDX (lossy; not worth it).

## 2. How it fits what we already have

This is **additive**, not a rewrite. Three existing pieces do most of the heavy
lifting:

| Existing piece | Role for the editor |
| --- | --- |
| `deck.json` already supports data-driven slides (`type: image/youtube/iframe`) | The canvas slide is just a richer `type: "canvas"` entry — same loader path (`processDeck`). |
| `SlideStage` renders a fixed **1280×720 canvas** scaled to fit | The editor's coordinate space. Elements store absolute coords in 0–1280 × 0–720; display scaling is free. |
| `Slide.jsx` switches on `slide.type` | Add one `canvas` case → `<CanvasSlide>`. MDX/image/youtube slides are untouched. |

**Bonus:** canvas slides are *pure data*, so unlike MDX slides (which carry a
React `Component` that can't be serialized), they sync to the Stage window
trivially — and could even sync **live while editing**.

## 3. Data model

A new slide type. The deck structure is otherwise unchanged.

```json
{
  "id": "slide-3",
  "type": "canvas",
  "background": "#0b0b0b",
  "elements": [
    {
      "id": "title",
      "type": "text",
      "x": 80, "y": 60, "w": 700, "h": 140,
      "rotation": 0, "z": 1, "opacity": 1,
      "text": "Quarterly results",
      "fontFamily": "Inter", "fontSize": 56, "weight": 700, "italic": false,
      "color": "#ffffff", "align": "left", "valign": "top", "lineHeight": 1.2,
      "fill": null,
      "border": null
    },
    {
      "id": "pic",
      "type": "image",
      "x": 760, "y": 120, "w": 440, "h": 480,
      "rotation": 0, "z": 2, "opacity": 1,
      "src": "assets/chart.png", "fit": "contain", "alt": "Revenue chart",
      "border": { "width": 2, "color": "#ffffff", "style": "solid", "radius": 12 }
    },
    {
      "id": "accent",
      "type": "shape",
      "shape": "rect",
      "x": 80, "y": 220, "w": 200, "h": 8,
      "rotation": 0, "z": 0,
      "fill": "#8b5cf6",
      "border": null
    }
  ]
}
```

### Common element fields
`id, type, x, y, w, h` (canvas units), `rotation` (deg), `z` (order),
`opacity`, `fill` (background color or null), `border` (`{ width, color, style,
radius }` or null), `locked` (optional, ignore in editor).

### Per-type fields
- **text** — `text` (plain for MVP), `fontFamily, fontSize, weight, italic,
  color, align, valign, lineHeight, padding`.
- **image** — `src` (deck-relative or URL), `fit` (`cover|contain`), `alt`.
- **shape** — `shape` (`rect|ellipse|line`); appearance via common `fill`/`border`.
- **embed** _(later)_ — `{ kind: 'youtube'|'video'|'iframe', src, ... }`.

### Coordinate space
Everything is in the **1280×720** canvas. `SlideStage` already maps that to any
display size, so a value means the same fraction of the slide in the editor,
the presenter preview, and the Stage window.

A machine-readable **JSON Schema** ships alongside (`docs/canvas-slide.schema.json`)
so an AI assistant can target the format and we can validate decks.

## 4. Rendering — `CanvasSlide`

A read-only renderer comes first (so canvas slides display everywhere before any
editing exists):

- `src/components/slides/CanvasSlide.jsx` — maps `elements` → absolutely
  positioned **DOM** nodes inside the canvas, ordered by `z`, each with
  `transform: translate + rotate`, border, opacity, etc.
- Wired into `Slide.jsx` (`case 'canvas'`). Works in the preview and Stage
  because both already wrap slides in `SlideStage`.
- Image `src` resolution reuses the external-deck path (`convertFileSrc` in
  Tauri; URL/data-URL otherwise).
- `serializeSlide` in `useAudienceWindow.js` gains `elements` + `background`
  (plain JSON — no component problem), so the Stage renders canvas slides and
  could reflect **live edits** in real time.

**DOM, not `<canvas>`/Konva/Fabric.** Keeping elements as real DOM nodes is what
lets a future embed (YouTube/video/live app) be a first-class, positionable
element. Canvas-renderer libraries would forfeit that and complicate text.

## 5. The editor

A new **Edit mode** in the app (toggle between Present and Edit), with three
regions: a top **toolbar**, the **canvas**, and a right **properties panel**
(plus a layers list).

### Interaction library
Use **`react-moveable`** (drag / resize / **rotate** / snapping / group) +
**`react-selecto`** (marquee multi-select) rather than hand-rolling transform
handles. They're DOM-based, widely used in real slide/design editors, and
handle the fiddly math (rotation-aware resize, snap guides, group transforms).

**Coordinate handling:** the editor shows the canvas scaled to fit the edit
area; Moveable works in screen space and we convert to canvas units via the
scale factor on commit. All persisted values stay in 1280×720 space.

### Interactions (what "max positioning power" means)
- Select (click), multi-select (marquee / shift-click)
- Move, resize (8 handles), **rotate**
- **Z-order** (bring forward/back, to front/back)
- Snapping + alignment guides (to canvas edges, centers, other elements)
- Arrow-key nudge (1px / 10px), drag-duplicate (alt)
- Delete, duplicate, copy/paste
- Inline **text editing** via `contentEditable` (double-click to edit)
- Alignment/distribution tools (left/center/right, distribute)

### Panels
- **Toolbar:** add Text / Image / Shape, z-order, align, undo/redo.
- **Properties panel** (selected element): X/Y/W/H/rotation, fill, **border**
  (width/color/style/radius), opacity; text props (font, size, weight, color,
  align); image fit; shape type.
- **Layers:** list elements, reorder, lock/hide.

## 6. Images & assets

The friction-killer. Target gesture: **drop a file on the slide → it appears,
placed, done.**

- **Tauri (primary):** on import, copy the file into `<deck>/assets/`, add an
  `image` element referencing the relative path; display via `convertFileSrc`.
  Paste-from-clipboard supported too.
- **Web / bundled decks:** no filesystem — fall back to data-URL (inline in the
  slide JSON; note the size cost) or object-URL (session-only) and rely on
  export. Bundled decks (in `src/`) can't be written at runtime, so the editor
  is **Tauri-external-deck-first** (same conclusion as the camera-overlay work).

## 7. Persistence

Reuse the hybrid model already established for the camera overlay:

- **Draft** edits in `localStorage` per deck (so nothing is lost mid-edit),
  plus an explicit **Save** that writes the deck back to `deck.json`
  (generalize `saveOverlayToDeckFile` → `saveDeck` for external decks in Tauri).
- **Bundled decks** can't be written → editing them produces a localStorage
  draft and an **export/download** of the deck JSON.
- Imported images are copied into the deck folder on save (Tauri).

## 8. Undo / redo

Non-negotiable for an editor. MVP: a capped **history stack of element-model
snapshots** (immutable updates make this cheap); push on each committed change,
`Ctrl/Cmd+Z` / `Shift+Z`. Can evolve to a command pattern later if needed.

## 9. AI integration

This is where "roll your own" pays off:

- Document the schema (§3) so an **external assistant** (Claude/ChatGPT editing
  files) can emit valid canvas slides directly into `deck.json` — coordinates
  and all. The JSON Schema enables validation and better AI output.
- Workflows: _AI drafts a canvas slide_ → inserted; _AI edits the selected
  element/slide_. The human then does the 10-second visual nudge AI is bad at.
- _(Later)_ in-app generation via the Claude API ("add a title + 3 bullets and
  leave a 440px image slot on the right") returning elements JSON.

The hybrid — **AI structure + human visual polish** — is the actual fix for
"AI slides haven't been great," and it only works because the format is
structured data.

## 10. Coexistence with MDX

Per-slide `type`. A deck freely mixes `canvas`, `mdx`, `image`, `youtube`
slides. The editor operates on `canvas` slides; MDX slides remain code-edited.
A future "convert this MDX slide to canvas" action is possible but explicitly
out of scope (the inverse is lossy).

## 11. Phased plan

### E1 — MVP (the wedge)
- [ ] `canvas` slide type + `CanvasSlide` read-only renderer (wired into
      `Slide.jsx`, works in preview + Stage)
- [ ] `serializeSlide` carries `elements`/`background` to the Stage
- [ ] JSON Schema for the canvas slide
- [ ] Edit mode shell (toolbar / canvas / properties panel)
- [ ] Add / select / move / resize / **rotate** text & image elements
      (react-moveable + react-selecto)
- [ ] Inline text editing; **borders** on elements
- [ ] **Image import** (drag-drop / paste / file) → copy to `assets/` (Tauri)
- [ ] z-order; arrow-nudge; delete/duplicate
- [ ] Minimal **undo/redo**
- [ ] Save to deck.json (Tauri external) + localStorage draft

### E2 — Real editor
- [ ] **Shapes** (rect / ellipse / line) with fill + border
- [ ] Snapping + alignment guides; align/distribute tools
- [ ] Multi-select group transforms; copy/paste across slides
- [ ] Robust undo/redo; layers panel
- [ ] Web export/download of the deck

### E3 — Beyond
- [ ] Rich text within a box (mixed styling, bullets)
- [ ] Embed elements (YouTube / video / local app) as first-class
- [ ] Templates / element library; in-app AI generation
- [ ] Live edit → Stage sync while presenting

## 12. Risks & open questions

- **Rich text** is a genuine project on its own → MVP stays plain-ish text per
  box (font/size/color/align), rich text deferred to E3.
- **Scale/coordinate bugs** with Moveable inside the scaled canvas — needs care;
  prototype early to de-risk.
- **Asset management** — orphaned images on delete, name collisions, large
  data-URLs in web mode.
- **Bundled-deck editing** is inherently limited (no runtime write) — accept
  Tauri-external-first.
- **Framer Motion transitions** vs the editor — editing should disable
  slide-enter animations; presenting keeps them.
- **Dependencies added:** `react-moveable`, `react-selecto` (both small, MIT).

## 13. Rough effort

- E1 (MVP): ~1–2 weeks of focused work — the bulk is the editor shell +
  Moveable wiring + image import/persistence.
- E2: another ~1–2 weeks.
- E3: open-ended.

The MVP alone should remove the image/text friction that sends us back to
Google Slides, and prove the data model for AI generation.
