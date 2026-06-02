# Roadmap — LiveSlides

_Status: active · updated 2026-05-30_

> Code-first presentation app: author slides in Markdown/MDX with React components, embed live web apps / video / rich media, trigger hotkey "joke" overlays, and ship as a web app or native desktop app (Tauri) with a presenter view.
>
> Collated from docs/IMPLEMENTATION.md (the phase deliverable checklists — the only file with GitHub-style task boxes). Done/not-done state reconciled against README.md "Current Status" and the existing feature docs (JOKE_ANIMATIONS_GUIDE.md, CAMERA_OVERLAY.md).

## Phase 5 — Code Coherence & Refactor (current priority)

> Most incoherence in the codebase traces to one root cause: the same logic is written two or three times — once per window (`App.jsx` vs `AudienceView.jsx`), once per transport (Tauri vs web), once per registration site — and the copies have drifted. The web and desktop builds are intentionally *not* identical (external decks and the folder picker are desktop-only); the goal here is to make that divergence explicit and centralized rather than scattered. Ordered by impact.

### 5.1 — Single source of truth for the deck list ✅ done
A bundled deck was declared in four places that had to stay in sync, and they already disagreed.
- [x] Create `src/decks/registry.js` — array of `{id, name, icon, description}` + `loadDeck(id)` using dynamic `import()`
- [x] `App.jsx`: remove the static deck imports, the `availableDecks` array, and the load `switch`; consume the registry instead
- [x] `AudienceView.jsx`: consume the same registry (`loadDeck` + `processDeck`, dropping its own module loader)
- [x] **Bug:** `deckPositions` initial state (`App.jsx`) hardcoded only 5 of 7 deck ids — replaced with lazy `{}` + default `0`
- [x] **Bug:** static deck imports in `App.jsx` referenced uncommitted deck folders, breaking a fresh-clone build — dynamic import removes this
- [x] Rename `lib/deckRegistry.js` → `lib/externalDeckRegistry.js` to stop "registry" meaning two different things
- [x] `.gitignore`: track `src/decks/registry.js` while keeping deck *content* local-only

### 5.2 — Transport abstraction for the two-window comms
`useAudienceWindow.js` branches on `isTauri()` in five places, and the two sides use different message vocabularies (web `SLIDE_STATE`/`SHOW_JOKE`/`AUDIENCE_READY` vs Tauri `slide-state`/`show-joke`/`audience-ready`).
- [ ] Define a transport interface: `{ openWindow(), close(), send(channel, payload), subscribe(channel, cb) }`
- [ ] Implement `tauriTransport` (WebviewWindow + events) and `webTransport` (window.open + postMessage), mapping one internal channel vocabulary
- [ ] Rewrite `useAudienceWindow.js` to hold presentation logic once, transport-agnostic
- [ ] _Bigger refactor — do as its own change with manual testing in both web and Tauri._

### 5.3 — Deduplicate render + navigation ✅ done
- [x] Extract `renderSlide` (was copy-pasted in `App.jsx` and `AudienceView.jsx`) into a shared `components/slides/Slide.jsx`
- [x] Route the `onNext`/`onPrev`/`onGoTo` callbacks in `App.jsx` through `useSlideNavigation` (single `handleNext`/`handlePrev`/`handleGoTo`) instead of reimplementing bounds-checked navigation inline

### 5.4 — Make the web/Tauri divergence explicit
- [ ] Centralize a `capabilities` object (`{ externalDecks, folderPicker, nativeWindows }`) derived from `isTauri()`; have the UI key off capabilities rather than scattered `isTauri()` guards

### 5.5 — Tighten the external-deck story
External decks use regex markdown→HTML (no MDX primitives), and `AudienceView.jsx:120-125` relabels `mdx` slides as `text` and re-wraps HTML — a hidden second-class path.
- [ ] Decide: (a) document the simple-markdown limitation and route bundled + external through one HTML path (no `type` rewriting), or (b) adopt runtime MDX via `@mdx-js/mdx` `evaluate` (dep already installed) for full parity
- [ ] Consolidate `resolveAssetPath` (deckLoader) and `resolveExternalAsset` (externalDeckLoader) — near-duplicates

### 5.6 — Low-risk cleanup
- [ ] Replace ~80 `console.log`/`error` calls (24 in `deckRegistry.js` alone) with a `debug()` helper gated on a flag, or strip
- [ ] Remove/relocate stray root files: `app-example.jsx`, `test-mdx.js`, and the `temp/` folder (source `.md` decks + `AIOF_presentation/`)
- [ ] Replace the `try/catch` + `setTimeout(setError)` workaround in `MDXSlide.jsx` with a proper `SlideErrorBoundary` class component

## Phase 1 — Core Slideshow Engine
- [x] Vite + React project initialized
- [x] All 4 slide types render correctly (text, image, YouTube, iframe)
- [x] Keyboard navigation works
- [x] Fade and slide transitions implemented
- [x] Fullscreen toggle works
- [x] Click-to-advance works
- [x] On-screen controls (prev/next/fullscreen)
- [x] Responsive sizing for all media types
- [x] Demo deck with all slide types

## Phase 2 — Deck Loading & MDX
- [x] Vite configured for MDX
- [x] `deckLoader.js` loads deck.json + MDX files
- [x] All MDX primitives implemented (Grid, Block, Media, Iframe, YouTube, Callout)
- [x] Layouts work responsively (center, split-40-60, split-60-40, three-up, full)
- [x] Frontmatter (notes) parsed and stored
- [x] Demo deck converted to MDX format
- [x] Error handling for missing files

## Phase 3 — Jokes & Presenter View
- [x] Framer Motion integrated
- [x] `jokes.json` loader implemented
- [x] Media preloading works
- [x] Hotkey system triggers overlays
- [x] Overlays animate smoothly
- [x] Auto-dismiss works
- [x] Presenter window opens/closes
- [x] Cross-window sync works (postMessage / Tauri events)
- [x] Timer counts up from presentation start
- [x] Next slide preview renders
- [x] Joke test buttons work
- [x] Demo jokes.json with sample media

## Phase 3.5 — Enhanced Joke Animations
- [x] `jokeAnimations.js` utility library
- [x] Updated `JokeOverlay.jsx` with Framer Motion
- [x] Animation variant definitions for all entry/exit types
- [x] Position and size calculation helpers
- [x] Updated demo jokes.json with examples
- [x] Documentation for joke configuration
- [x] Migration guide for existing jokes

## Phase 4 — Desktop Wrapper (Tauri)
- [x] Tauri v2 initialized with Rust backend
- [x] Multi-window support (Presenter + Stage)
- [x] Cross-window sync via Tauri events
- [x] Dual-mode: works in web and desktop
- [x] Capabilities configured for permissions
- [x] Stage view with navigation controls
- [x] Camera overlay toggle in Stage view
- [ ] File dialog for opening deck folders
- [ ] Global hotkeys (opt-in, system-wide)
- [ ] Production builds (macOS / Windows / Linux)
- [ ] App icons and installers

## Phase 4.5 — External Deck Loading
- [ ] Tauri fs/dialog plugins installed and configured
- [ ] `deckRegistry.js` — load/save/add decks to registry
- [ ] `externalDeckLoader.js` — runtime MDX compilation for external decks
- [ ] Asset URL conversion for local files
- [ ] Updated DeckSelector with external deck support
- [ ] "Add Deck" dialog with folder picker
- [ ] Registry auto-created on first run
- [ ] Error handling for invalid deck folders

## Testing & QA
- [ ] All slide types render correctly
- [ ] Transitions smooth at 60fps
- [ ] Iframes load and are interactive
- [ ] YouTube embeds play
- [ ] Jokes display within 100ms of keypress
- [ ] Presenter view stays in sync
- [ ] Works in Chrome, Firefox, Safari
- [ ] Desktop build opens and runs
- [ ] All joke animation types work smoothly
- [ ] Joke position/size presets and custom values place correctly
- [ ] Joke rotation and easing behave as configured
- [ ] Joke backward compatibility maintained
- [ ] Performance stays at 60fps across screen sizes

## Backlog
- [ ] Export to PDF / static site
- [ ] Advanced slide types: terminal (xterm.js), code highlighting (Shiki/Prism), charts (Recharts)
- [ ] Deck packager / exporter (zip folder + lockfile)
- [ ] Session analytics: time per slide, export session log (CSV/JSON)
- [ ] Theming presets (light / dark / high-contrast) and large-type toggle
- [ ] Smart content positioning to avoid the camera overlay region
- [ ] Multiple camera overlay regions + show/hide animation
- [ ] Joke extras: sound effects, particle effects, gesture dismissal, chained animations
