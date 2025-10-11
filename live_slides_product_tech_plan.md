# LiveSlides — Product & Tech Plan

A lightweight, presenter‑friendly slide app for YouTube and live demos. Author slides in Markdown/MDX, embed live web apps, images, and videos, trigger quick “joke” overlays with hotkeys, and ship as a web app or desktop app (Tauri) with fullscreen/kiosk support.

---

## 1) Goals & Non‑Goals
**Goals**
- Dynamic presentations with animations and live embeds (apps/YouTube/iframed tools).
- Fast authoring with Markdown; power‑user control via MDX + React components.
- Local‑first decks (open a folder and present) + simple theming.
- Hotkey “jokes” (image/GIF/video overlays) with preload and auto‑dismiss.
- Fullscreen kiosk mode, presenter view (notes, timer, next slide), and OBS‑friendly.

**Non‑Goals (v1)**
- Cloud sync, collaborative editing, and online CMS.
- Complex timeline animation tools (After Effects‑level). Keep transitions simple.
- Full WYSIWYG slide editor (focus on authoring via files first).

---

## 2) User Stories
- **As a presenter**, I can open a deck folder and run the slideshow fullscreen with smooth transitions.
- **As a creator**, I can write slides in MD/MDX and reference local assets without uploads.
- **As a demoer**, I can embed my local dev app via iframe and interact live.
- **As an entertainer**, I can hit hotkeys to show preloaded gags for 1–2 seconds.
- **As a producer**, I can use a presenter window with notes and a timer.

---

## 3) Feature List
### MVP
- Slide types: **Text/Markdown**, **Image**, **YouTube**, **Iframe (web app)**.
- Navigation: Keyboard (←/→/Space), click‑to‑advance, on‑screen controls.
- Transitions: Fade + Slide.
- Fullscreen toggle.
- Add local images at runtime (file picker).
- Deck loader: read `deck.json` + per‑slide `.mdx` files.

### V1
- **Joke Overlay Manager**: configurable hotkeys, image/GIF/video, duration, sound, preload.
- **Presenter View**: second window with notes, timer, next slide, joke test buttons.
- Theming via CSS variables (light/dark/high‑contrast).
- Better animations with Framer Motion (stagger/scale/crossfade).
- Tauri desktop build: file dialog, kiosk mode, (optional) global hotkeys.
- Basic analytics: time per slide; export session log.

### V1+ / Later
- xterm.js terminal slide (WS bridge) for command demos.
- MDX shortcodes for charts (Recharts) and code highlights (Shiki/Prism).
- Deck packager/exporter (zip folder + lockfile).

---

## 4) Architecture Overview
- **Renderer/UI**: React single‑page app (Vite). Routes not required; internal index.
- **Deck Layer**: Loads `deck.json` → resolves slide list → fetches and renders MDX files.
- **Slide Primitives** (React components used inside MDX): `Grid`, `Block`, `Media`, `Iframe`, `YouTube`, `Callout`.
- **Overlay System**: top‑level portal rendering transitions (jokes, toasts, countdowns).
- **State**: lightweight with React state; context for deck + navigation; no heavy store.
- **Native Shell (optional)**: Tauri for file dialogs, multi‑window presenter, kiosk.

---

## 5) Tech Choices
- **Core:** React + Vite
- **Authoring:** MDX (Markdown + JSX)
- **Styling:** CSS Modules or Tailwind (utility‑first); CSS variables for themes
- **Transitions:** CSS (MVP), **Framer Motion** (V1)
- **Embeds:** `<iframe>` for apps, YouTube nocookie embeds
- **Desktop:** **Tauri** (Rust backend, small footprint)
- **Hotkeys:** native `keydown` (web) + **Tauri global shortcuts** (desktop)
- **Terminal (later):** xterm.js + Node/Tauri command bridge over WebSocket

---

## 6) Data Model & Files
### Folder structure per deck
```
/talks/2025-10-launch/
  deck.json               # structure, theme, options
  slides/
    00-title.mdx
    01-demo.mdx
    02-results.mdx
  assets/
    images/...            # referenced by MDX/JSON
    videos/...
  apps/
    widget/index.html     # embeddable local app
  jokes.json              # hotkey overlay config
```

### `deck.json` (schema v0)
```json
{
  "title": "Launch Day",
  "theme": "dark",
  "transition": "slide",
  "assetsBase": "./assets",
  "jokes": "./jokes.json",
  "slides": [
    { "id": "title",   "src": "slides/00-title.mdx",  "layout": "center" },
    { "id": "demo",    "src": "slides/01-demo.mdx",   "layout": "split-40-60" },
    { "id": "results", "src": "slides/02-results.mdx", "layout": "center" }
  ]
}
```

### `jokes.json` (schema v0)
```json
{
  "position": "center",
  "maxWidth": "40vw",
  "backdrop": false,
  "hotkeys": {
    "Digit1": { "type": "image", "src": "./assets/jokes/boom.png", "durationMs": 1500 },
    "Digit2": { "type": "video", "src": "./assets/jokes/rimshot.mp4", "durationMs": 1200, "muted": false },
    "KeyQ":  { "type": "gif",   "src": "./assets/jokes/confetti.gif", "durationMs": 2000 }
  }
}
```

### MDX slide example (`slides/01-demo.mdx`)
```mdx
---
notes: "Hit Digit2 for rimshot after revealing the chart."
---

# Live App Demo

<Grid cols={{ base: 1, md: 2 }} gap="xl" align="center">
  <Block>
    <ul>
      <li>Hot reload</li>
      <li>Zero‑copy path</li>
      <li>~18 ms median latency</li>
    </ul>
  </Block>
  <Block>
    <Iframe src="../apps/widget/index.html" height="60vh" />
  </Block>
</Grid>
```

---

## 7) UI/UX Guidelines
- **Responsive first:** container queries; media constrained by `max-width:100%` and viewport heights.
- **Named layouts** with sane defaults: `center`, `split-40-60`, `split-60-40`, `three-up`.
- **Keyboard affordances:** visible hint (press **F** fullscreen, **S** switch transition).
- **Non‑blocking overlays:** jokes don’t eat pointer events; quick fade/scale in/out.
- **Presenter view:** large clock, current slide notes, next slide preview, joke palette.

---

## 8) Security & Permissions
- Iframes: use `sandbox` attributes where possible; allow minimal capabilities.
- YouTube: `youtube-nocookie.com` embeds; restrict referrer policy.
- Tauri: scoped filesystem access; disable APIs not used; validate deck paths.

---

## 9) Performance
- Preload joke media on deck load.
- Lazy load slides (fetch MDX on first entry or prefetch next slide).
- Memoize MDX compilation (esbuild/swc plugin or precompile at build time).
- Avoid heavy reflows; animate transforms/opacity only.

---

## 10) Accessibility
- Keyboard navigation parity; focus management on overlays.
- ARIA roles for controls; alt text for images; captions for videos when possible.
- High‑contrast theme and large‑type toggle.

---

## 11) Testing
- Unit: slide parsing, hotkey routing, overlay timings.
- E2E: Cypress for navigation, fullscreen, iframe interaction.
- Manual: deck with mixed assets (local/remote), slow network throttling.

---

## 12) Packaging & Delivery
- **Web build:** static export for hosting or local file use.
- **Desktop:** Tauri builds for macOS/Win/Linux; app opens a deck folder and remembers recent decks.
- **OBS workflow:** recommend window capture; optional timer‑based auto‑advance mode for fixed takes.

---

## 13) Incremental Roadmap
**Sprint 1 (MVP)**
- Deck runtime: slide array, transitions, fullscreen.
- Slide types: text, image, YouTube, iframe.
- File picker for local images.
- Minimal theme tokens.

**Sprint 2 (Authoring)**
- Deck loader (`deck.json` + MDX).
- MDX primitives: `Grid`, `Block`, `Media`, `Iframe`, `YouTube`.
- Per‑slide layouts + notes front‑matter.

**Sprint 3 (Showtime)**
- Joke Overlay Manager + preload + config (`jokes.json`).
- Presenter window (web popout; Tauri multi‑window later).
- Framer Motion transitions; theme presets.

**Sprint 4 (Desktop)**
- Tauri wrapper: file dialog, kiosk mode, recent decks.
- Optional global hotkeys for jokes/advance.
- Session logging (CSV/JSON export).

**Future**
- xterm.js TerminalSlide, chart components, exporter.

---

## 14) Open Questions
- Do we prefer MDX compiled at build time (faster runtime) or on‑the‑fly (flexible at showtime)?
- Should jokes queue or interrupt current overlay? (Propose: interrupt with small cooldown.)
- Global hotkeys on desktop by default, or opt‑in per deck? (Propose: opt‑in.)

---

## 15) Definitions of Done (selected)
- **MVP:** Run a mixed deck (image/YouTube/iframe) fullscreen with keyboard controls and transitions.
- **Authoring v1:** A new deck folder with `deck.json` + three MDX slides renders with responsive layouts.
- **Jokes v1:** Pressing mapped hotkeys shows overlays within 100 ms and auto‑hides.
- **Desktop v1:** Tauri app opens a folder, remembers it, toggles kiosk, and supports global hotkeys (opt‑in).

