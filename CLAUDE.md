# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # Install JS dependencies
npm run dev            # Vite dev server (http://localhost:5183, strictPort) — web mode
npm run build          # Production build to dist/ (multi-page: index.html + audience.html)
npm run lint           # ESLint over the repo
npm run preview        # Preview the production build

npm run tauri:dev      # Run the desktop app — preferred way to launch it
npm run tauri:build    # Build the native desktop bundle
```

There is **no test framework**. `test-mdx.js` is a standalone script used to verify the shape of a compiled MDX module (default export + `frontmatter`); it is not run by any harness. Tauri builds require Rust (`rustup`) and platform WebKit/GTK dev packages — see README for the Linux/macOS/Windows prerequisites.

**Launching the desktop app:** prefer `npm run tauri:dev` — it starts Vite itself (via `beforeDevCommand`), waits for it, then compiles the Rust backend and opens the window. Do **not** have a Vite dev server already running, since the dev port is pinned (`vite.config.js` → `server: { port: 5183, strictPort: true }`, matched by `devUrl` in `src-tauri/tauri.conf.json`); a second `npm run dev` would fail on the busy port. The strict, fixed port exists so the Tauri window always loads *this* app rather than whatever else happens to be on the default Vite port. `cd src-tauri && cargo run` also works but does **not** auto-start Vite, so Vite must already be running. The first Rust compile is slow (one-time); afterward only `src-tauri/` changes recompile — frontend edits hot-reload with no Rust rebuild.

## Architecture

LiveSlides is a code-first presentation tool: React 19 + Vite + Tailwind v4 + Framer Motion, with MDX slides, packaged as a Tauri v2 desktop app (also runs as a plain web app).

### Two windows, one codebase

The app is a **two-window system** built as a Vite multi-page app:

- **`index.html` → `src/main.jsx` → `App.jsx`** — the **Presenter/control** view. Shows current slide, next-slide preview, speaker notes, navigation, the joke panel, deck selector, and theme/transition toggles. This is the "control room."
- **`audience.html` → `src/audience-main.jsx` → `AudienceView.jsx`** — the clean **Stage/Audience** view for the projector/external display. Renders only the slide (plus joke overlays and camera overlay).

The two windows communicate, and the transport is chosen at runtime by `isTauri()` (`window.__TAURI_INTERNALS__`):

- **Desktop (Tauri):** native `WebviewWindow` + Tauri events — `slide-state`, `show-joke`, `dismiss-joke`, `audience-ready`.
- **Web:** `window.open` + `postMessage` — message types `SLIDE_STATE`, `SHOW_JOKE`, `DISMISS_JOKE`, `AUDIENCE_READY`, `TRIGGER_JOKE`.

This dual-transport pattern is centralized in `src/hooks/useAudienceWindow.js`. Because React components can't be serialized across windows, slide state is sent as plain data (`serializeSlide` strips the `Component` and sends `html`/`frontmatter`/type-specific fields); the audience window re-resolves bundled decks locally by `deckId`.

### Decks

A deck is a folder under `src/decks/<id>/`:

- `deck.json` — config: `title`, `theme` (`dark`/`light`), `transition`, optional `cameraOverlay`, and a `slides[]` array. Each slide entry is either an MDX reference (`{id, src: "slides/xx.mdx", layout}`) or an inline typed slide (`{id, type: "image"|"youtube"|"iframe", ...}`).
- `index.js` — **namespace-imports** each MDX file (`import * as Foo from './slides/...mdx'`) and maps slide `id` → module in `mdxModules`. Exports `{config, mdxModules, jokes}`. Namespace imports are required so `frontmatter` is accessible alongside the default component.
- `slides/*.mdx` — slide content. Frontmatter `notes:` becomes the speaker notes.
- `jokes.json` (optional) — hotkey-triggered overlays.

`src/lib/deckLoader.js#processDeck(config, mdxModules)` merges the config's `slides[]` with the pre-imported MDX modules into the runtime `slides` array consumed by both windows. MDX is compiled **at build time** by the `@mdx-js/rollup` plugin (`vite.config.js`), with `remark-frontmatter`, `remark-mdx-frontmatter`, and `remark-gfm`.

**Adding a bundled deck is a multi-file change** (no auto-discovery): create the deck folder, then in `App.jsx` add the `import`, a `case` in the deck-loading `useEffect`, and an entry in the `availableDecks` array. `AudienceView.jsx` has its own parallel deck-loading logic that must also recognize the new deck. Keep these in sync.

> **Heads up — not all decks are committed.** `.gitignore` excludes `src/decks` and `public/decks`. Only `demo-deck`, `my-presentation`, and `quick-demo` are tracked. `App.jsx` statically imports several other decks (`vibe-coding`, `ai-frameworks`, `aiof-consultancy`, `aiof-visual`) that exist only locally — a fresh clone will fail to build until those imports/cases are removed or the deck folders are restored.

### External decks (Tauri-only)

Decks can also be loaded from arbitrary filesystem folders at runtime:

- `src/lib/deckRegistry.js` — persists references (path, name, id) in `~/Documents/LiveSlides/registry.json` via the Tauri FS/dialog plugins.
- `src/lib/externalDeckLoader.js` — reads `deck.json` + MDX from disk at runtime. **Important:** it does *not* do runtime MDX compilation — it uses a small regex-based markdown→HTML renderer, so external decks support only basic markdown (headers, bold/italic, lists, code) and **cannot use the MDX primitive components** (`Grid`, `Callout`, etc.). Local asset paths are rewritten through Tauri's `convertFileSrc`.

### Slide rendering

`renderSlide` (duplicated in `App.jsx` and `AudienceView.jsx`) switches on `slide.type`: `text`, `image`, `youtube`, `iframe`, `mdx`, `error`. MDX slides render via `components/slides/MDXSlide.jsx`, which wraps content in `SlideLayout` and injects `src/lib/mdxComponents.jsx` — the MDX primitives (`Grid`, `Block`, `Media`, `Iframe`, `YouTube`, `Callout`) plus styled HTML element overrides. `MDXSlide` includes a try/catch error boundary so a broken slide shows an error instead of crashing the deck.

`SlideLayout.jsx` defines the named layouts referenced by `layout`: `center`, `split-40-60`, `split-60-40`, `three-up`, `full`.

### State & interaction

- `App.jsx` is the source of truth. `deckPositions` holds a per-deck slide index (each deck remembers its position). `useSlideNavigation.js` is pure logic (next/prev/goTo + bounds), not state. Every navigation bumps `transitionKey` to re-trigger Framer Motion's `AnimatePresence`.
- **Transitions:** 10 Framer Motion variants in `components/Transition.jsx`, cycled with the `S` key.
- **Theme:** dark/light driven by CSS variables (`--bg-app`, `--text-main`, …) and a `.light-theme` class on the root; default comes from `deck.json#theme`, toggleable in the UI and synced to the audience window.
- **Jokes:** `useJokeManager.js` preloads assets and listens for global keydown hotkeys; `jokeAnimations.js` supplies Framer Motion variants/positioning; `JokeOverlay.jsx` renders. Jokes are mirrored to the audience window.
- **Camera overlay:** a configurable blocked-out region (`cameraOverlay` in `deck.json`) for a presenter webcam feed; toggled with `C`.
- **Keyboard:** navigation/fullscreen/transition/camera/presenter keys live in `useKeyboardNav.js`; joke hotkeys are handled separately in `useJokeManager.js`. Shortcuts: `←/→`/`Space` navigate, `F` fullscreen, `S` cycle transition, `P` toggle stage window, `C` camera overlay.

### Tauri backend

`src-tauri/src/lib.rs` is minimal: it registers the `fs`, `dialog`, and (debug-only) `log` plugins. There are no custom Rust commands — window management and external-deck loading happen entirely on the JS side via the Tauri API. Window/bundle config is in `src-tauri/tauri.conf.json`.
