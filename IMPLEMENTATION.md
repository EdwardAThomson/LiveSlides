# LiveSlides — Implementation Plan

This document details the technical implementation strategy for building LiveSlides from scratch. It complements `live_slides_product_tech_plan.md` with concrete architectural decisions and build order.

---

## Implementation Philosophy

1. **Build incrementally** - Each phase produces a working, testable app
2. **Minimize dependencies** - Start with React fundamentals, add libraries only when needed
3. **File-based architecture** - Deck data lives in files, not databases
4. **Progressive enhancement** - Web first, desktop wrapper later

---

## Phase 1: Core Slideshow Engine (Sprint 1)

### Goal
A working React app that can display slides with transitions and keyboard navigation.

### File Structure
```
/src
  /components
    SlideChrome.jsx          # Container with controls
    Transition.jsx           # Transition wrapper component
    /slides
      TextSlide.jsx
      ImageSlide.jsx
      YouTubeSlide.jsx
      IframeSlide.jsx
  /hooks
    useKeyboardNav.js        # Keyboard event handling
    useSlideNavigation.js    # Slide index management
  /lib
    slideSchema.js           # Slide data validation
  App.jsx
  main.jsx
  index.css
/public
  /demo-deck                 # Sample deck for testing
    /assets
package.json
vite.config.js
```

### Tech Stack (Phase 1)
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **CSS Modules** or **Tailwind** - Styling (recommend Tailwind for speed)
- **No animation library yet** - Pure CSS transitions

### Key Components

#### `App.jsx` - Main orchestrator
```javascript
// Responsibilities:
// - Manage slide array state
// - Track current slide index
// - Handle fullscreen API
// - Coordinate keyboard shortcuts
// - Provide slide context to children
```

#### `useSlideNavigation.js` - Navigation logic
```javascript
// Exports:
// - currentIndex
// - totalSlides
// - next() / prev() / goTo(n)
// - canGoNext / canGoPrev
// - Handles bounds checking
```

#### `useKeyboardNav.js` - Keyboard handling
```javascript
// Listens for:
// - ArrowLeft/ArrowRight - navigation
// - Space - next slide
// - F - fullscreen toggle
// - S - cycle transitions (dev feature)
// - Escape - exit fullscreen
```

#### Slide Components
Each slide type is a pure component:
- Receives props (src, alt, html, etc.)
- Handles its own responsive sizing
- No internal state
- Wrapped by `Transition` component

### Data Model (Phase 1)
```javascript
// Slide schema (in-memory for now)
const slide = {
  id: string,           // unique identifier
  type: 'text' | 'image' | 'youtube' | 'iframe',
  
  // Type-specific fields:
  html?: { title, body },        // for text
  src?: string,                  // for image/iframe
  alt?: string,                  // for image
  youtubeId?: string,            // for youtube
  start?: number,                // for youtube
}
```

### Deliverables
- [ ] Vite + React project initialized
- [ ] All 4 slide types render correctly
- [ ] Keyboard navigation works
- [ ] Fade and slide transitions implemented
- [ ] Fullscreen toggle works
- [ ] Click-to-advance works
- [ ] On-screen controls (prev/next/fullscreen)
- [ ] Responsive sizing for all media types
- [ ] Demo deck with all slide types

---

## Phase 2: Deck Loading & MDX (Sprint 2)

### Goal
Load slides from files instead of hardcoded arrays. Support MDX authoring.

### New Dependencies
- `@mdx-js/rollup` - MDX compilation in Vite
- `remark-frontmatter` - Parse YAML frontmatter
- `remark-gfm` - GitHub-flavored markdown

### File Structure Additions
```
/src
  /components
    /mdx-primitives
      Grid.jsx              # Layout grid
      Block.jsx             # Content block
      Media.jsx             # Image/video wrapper
      Iframe.jsx            # Iframe wrapper
      YouTube.jsx           # YouTube embed
      Callout.jsx           # Highlighted box
  /lib
    deckLoader.js           # Loads deck.json + MDX files
    mdxComponents.js        # MDX component mapping
/public
  /demo-deck
    deck.json
    /slides
      00-intro.mdx
      01-demo.mdx
      02-outro.mdx
    /assets
      /images
```

### Deck Loading Strategy

#### Option A: Runtime Loading (Recommended for MVP)
- Fetch `deck.json` on app mount
- Dynamically import MDX files using Vite's `import()` with `?raw` suffix
- Compile MDX in browser using `@mdx-js/mdx` (runtime)
- **Pros**: Flexible, can load any deck folder
- **Cons**: Slower initial render, larger bundle

#### Option B: Build-time Compilation
- Import MDX files statically
- Pre-compile during Vite build
- **Pros**: Faster runtime, smaller bundle
- **Cons**: Deck must be known at build time

**Decision: Start with Option A for flexibility, optimize to Option B later**

### `deckLoader.js` Implementation
```javascript
// Responsibilities:
// 1. Fetch deck.json
// 2. Resolve asset paths relative to deck folder
// 3. Load and compile MDX slides
// 4. Return normalized slide array
// 5. Handle errors gracefully

export async function loadDeck(deckPath) {
  const config = await fetch(`${deckPath}/deck.json`).then(r => r.json())
  
  const slides = await Promise.all(
    config.slides.map(async (slideDef) => {
      if (slideDef.src.endsWith('.mdx')) {
        const mdxContent = await fetch(`${deckPath}/${slideDef.src}`).then(r => r.text())
        const { default: Component, frontmatter } = await compileMDX(mdxContent)
        return {
          id: slideDef.id,
          type: 'mdx',
          Component,
          layout: slideDef.layout || 'center',
          notes: frontmatter.notes,
        }
      }
      return slideDef // JSON-defined slide
    })
  )
  
  return { config, slides }
}
```

### MDX Primitives
Each primitive is a styled React component:

```jsx
// Grid.jsx - Responsive grid layout
<Grid cols={{ base: 1, md: 2 }} gap="xl" align="center">
  {children}
</Grid>

// Block.jsx - Content container with optional styling
<Block variant="primary" | "secondary" | "accent">
  {children}
</Block>

// Media.jsx - Responsive image/video
<Media src="./assets/chart.png" alt="..." maxHeight="60vh" />

// Iframe.jsx - Sandboxed iframe
<Iframe src="../apps/widget" height="70vh" sandbox="allow-scripts" />

// YouTube.jsx - YouTube embed
<YouTube id="dQw4w9WgXcQ" start={42} />

// Callout.jsx - Highlighted box
<Callout type="info" | "warning" | "success">
  {children}
</Callout>
```

### Layouts
Predefined layout classes applied to slide container:
- `center` - Centered content, max-width constrained
- `split-40-60` - Two-column, 40% left, 60% right
- `split-60-40` - Two-column, 60% left, 40% right
- `three-up` - Three equal columns
- `full` - Edge-to-edge content

### Deliverables
- [ ] Vite configured for MDX
- [ ] `deckLoader.js` loads deck.json + MDX files
- [ ] All MDX primitives implemented
- [ ] Layouts work responsively
- [ ] Frontmatter (notes) parsed and stored
- [ ] Demo deck converted to MDX format
- [ ] Error handling for missing files

---

## Phase 3: Jokes & Presenter View (Sprint 3)

### Goal
Add hotkey-triggered overlays and a presenter window.

### New Dependencies
- `framer-motion` - Smooth overlay animations
- `react-use` - Utility hooks (useLocalStorage, useMedia)

### File Structure Additions
```
/src
  /components
    JokeOverlay.jsx         # Overlay portal + animation
    PresenterView.jsx       # Presenter window UI
    PresenterNotes.jsx      # Notes display
    PresenterTimer.jsx      # Session timer
    PresenterControls.jsx   # Joke test buttons
  /hooks
    useJokeManager.js       # Hotkey handling + preload
    usePresenterWindow.js   # Window.open management
  /lib
    jokeLoader.js           # Load jokes.json
```

### Joke System Architecture

#### `useJokeManager.js`
```javascript
// Responsibilities:
// - Load jokes.json
// - Preload all media (images/videos/gifs)
// - Listen for hotkeys
// - Trigger overlay with auto-dismiss timer
// - Handle cooldown between jokes
// - Expose test API for presenter view

export function useJokeManager(jokesConfigPath) {
  const [activeJoke, setActiveJoke] = useState(null)
  const [preloadStatus, setPreloadStatus] = useState({})
  
  // Returns:
  // - activeJoke: current joke or null
  // - triggerJoke(key): manually trigger
  // - preloadStatus: { [key]: 'loading' | 'ready' | 'error' }
}
```

#### `JokeOverlay.jsx`
```jsx
// Portal-based overlay
// - Renders above all content (z-index: 9999)
// - AnimatePresence from framer-motion
// - Configurable position (center, top, bottom)
// - Auto-dismiss after durationMs
// - Optional backdrop blur
// - Handles image/video/gif types

<AnimatePresence>
  {activeJoke && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      {renderJokeContent(activeJoke)}
    </motion.div>
  )}
</AnimatePresence>
```

### Presenter View

#### Strategy
- **Web MVP**: `window.open()` with `postMessage` communication
- **Desktop later**: Tauri multi-window API

#### Communication Protocol
```javascript
// Main window → Presenter window
{
  type: 'SLIDE_CHANGE',
  current: slideIndex,
  total: totalSlides,
  notes: string,
  nextSlidePreview: slideData,
}

// Presenter window → Main window
{
  type: 'NAVIGATE',
  direction: 'next' | 'prev' | 'goto',
  index?: number,
}

{
  type: 'TEST_JOKE',
  key: string,
}
```

#### `PresenterView.jsx` Layout
```
┌─────────────────────────────────────────┐
│ Timer: 00:12:34          [Reset] [Stop] │
├─────────────────────────────────────────┤
│                                         │
│  Current Slide Notes                    │
│  (Large, readable text)                 │
│                                         │
├─────────────────────────────────────────┤
│  Next Slide Preview    │  Joke Palette  │
│  (Thumbnail)           │  [1] Boom      │
│                        │  [2] Rimshot   │
│                        │  [Q] Confetti  │
└─────────────────────────────────────────┘
```

### Deliverables
- [ ] Framer Motion integrated
- [ ] `jokes.json` loader implemented
- [ ] Media preloading works
- [ ] Hotkey system triggers overlays
- [ ] Overlays animate smoothly
- [ ] Auto-dismiss works
- [ ] Presenter window opens/closes
- [ ] postMessage sync works
- [ ] Timer counts up from presentation start
- [ ] Next slide preview renders
- [ ] Joke test buttons work
- [ ] Demo jokes.json with sample media

---

## Phase 3.5: Enhanced Joke Animations (Sprint 3.5)

### Goal
Extend the joke system with configurable Framer Motion animations, positioning, and timing controls.

### Enhancement Overview
Transform jokes from simple fade/scale overlays into a rich animation system with:
- **Multiple entry/exit animations** (slide, bounce, flip, spin, zoom, etc.)
- **Flexible positioning** (center, corners, custom coordinates)
- **Size variants** (small, medium, large, fullscreen)
- **Advanced effects** (rotation, shake, blur, spring physics)
- **Configurable timing** (duration, delay, easing functions)

### Updated Joke Configuration Schema
```json
{
  "jokes": [
    {
      "id": "example",
      "hotkey": "1",
      "type": "image",
      "src": "./assets/joke.gif",
      "alt": "Funny joke",
      
      // NEW: Animation configuration
      "animation": {
        "entry": "slideInLeft",        // Entry animation type
        "exit": "slideOutRight",        // Exit animation type
        "duration": 500,                // Animation duration (ms)
        "easing": "spring",             // Easing function
        "delay": 0                      // Delay before showing (ms)
      },
      
      // NEW: Position configuration
      "position": "center",             // Preset or custom
      "customPosition": {               // Optional custom positioning
        "x": "50%",
        "y": "50%"
      },
      
      // NEW: Size configuration
      "size": "large",                  // small | medium | large | fullscreen
      "maxWidth": "80vw",               // Optional custom max width
      "maxHeight": "80vh",              // Optional custom max height
      
      // NEW: Visual effects
      "rotation": 0,                    // Rotation in degrees
      "effects": {
        "shake": false,                 // Shake effect on entry
        "blur": false,                  // Blur background more
        "backdrop": 0.3,                // Backdrop opacity (0-1, default 0.3)
        "backdropColor": "black",       // Backdrop color
        "shadow": "2xl"                 // Shadow size
      },
      
      // Existing fields
      "displayDuration": 2000,          // How long to show (ms)
      "loop": true,                     // For videos
      "muted": true                     // For videos
    }
  ]
}
```

### Animation Types

#### Entry Animations

**Basic:**
- `fade` - Simple opacity fade in
- `scale` - Scale up from 0.8 to 1.0
- `slideInLeft` - Slide in from left edge
- `slideInRight` - Slide in from right edge
- `slideInTop` - Slide in from top edge
- `slideInBottom` - Slide in from bottom edge
- `bounce` - Bouncy entrance with spring physics
- `flip` - 3D flip animation
- `spin` - Rotate while fading in
- `zoom` - Dramatic zoom from small
- `elastic` - Elastic spring effect
- `shake` - Shake while appearing

**Combinations:**
- `bounceRotate` - Bounce + rotation
- `slideScale` - Slide + scale
- `flipSlide` - Flip + slide
- `spinZoom` - Spin + zoom
- `shakeScale` - Shake + scale
- `slideRotate` - Slide + rotation

#### Exit Animations

**Basic:**
- `fade` - Simple opacity fade out
- `scale` - Scale down to 0.8
- `slideOutLeft` - Slide out to left edge
- `slideOutRight` - Slide out to right edge
- `slideOutTop` - Slide out to top edge
- `slideOutBottom` - Slide out to bottom edge
- `shrink` - Shrink to nothing
- `spinOut` - Rotate while fading out
- `zoomOut` - Zoom out dramatically

**Combinations:**
- `bounceRotateOut` - Bounce + rotation
- `slideScaleOut` - Slide + scale
- `flipSlideOut` - Flip + slide
- `spinZoomOut` - Spin + zoom
- `shakeScaleOut` - Shake + scale
- `slideRotateOut` - Slide + rotation

#### Easing Functions
- `linear` - No easing
- `easeIn` - Slow start
- `easeOut` - Slow end
- `easeInOut` - Slow start and end
- `spring` - Spring physics (bouncy)
- `bounce` - Bounce effect
- `anticipate` - Pull back before moving

### Position Presets
- `center` - Centered (default)
- `top-left` - Upper left corner
- `top-right` - Upper right corner
- `bottom-left` - Lower left corner
- `bottom-right` - Lower right corner
- `top` - Top center
- `bottom` - Bottom center
- `left` - Left center
- `right` - Right center

### Size Presets
- `small` - 30% of viewport
- `medium` - 50% of viewport
- `large` - 70% of viewport (default)
- `fullscreen` - 100% of viewport

### Implementation Changes

#### Updated `JokeOverlay.jsx`
```jsx
import { motion, AnimatePresence } from 'framer-motion';
import { getAnimationVariants, getPositionStyles, getSizeStyles } from '../lib/jokeAnimations';

export default function JokeOverlay({ joke, onDismiss }) {
  if (!joke) return null;

  const animation = joke.animation || {};
  const variants = getAnimationVariants(
    animation.entry || 'fade',
    animation.exit || 'fade',
    animation.easing || 'easeInOut'
  );
  
  const positionStyles = getPositionStyles(
    joke.position || 'center',
    joke.customPosition
  );
  
  const sizeStyles = getSizeStyles(
    joke.size || 'large',
    joke.maxWidth,
    joke.maxHeight
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      >
        <motion.div
          className="absolute"
          style={{
            ...positionStyles,
            ...sizeStyles,
            rotate: joke.rotation || 0
          }}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: (animation.duration || 500) / 1000,
            delay: (animation.delay || 0) / 1000
          }}
        >
          {/* Render joke content */}
          {renderJokeContent(joke)}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

#### New File: `lib/jokeAnimations.js`
```javascript
// Animation variant definitions for Framer Motion
export function getAnimationVariants(entry, exit, easing) {
  const easingMap = {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: { type: 'spring', stiffness: 300, damping: 20 },
    bounce: { type: 'spring', stiffness: 400, damping: 10 },
    anticipate: { type: 'spring', stiffness: 200, damping: 15 }
  };

  return {
    initial: getEntryInitial(entry),
    animate: getEntryAnimate(entry),
    exit: getExitState(exit)
  };
}

// Position calculation helpers
export function getPositionStyles(position, customPosition) {
  const presets = {
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'top-left': { top: '5%', left: '5%' },
    'top-right': { top: '5%', right: '5%' },
    'bottom-left': { bottom: '5%', left: '5%' },
    'bottom-right': { bottom: '5%', right: '5%' },
    top: { top: '5%', left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: '5%', left: '50%', transform: 'translateX(-50%)' },
    left: { top: '50%', left: '5%', transform: 'translateY(-50%)' },
    right: { top: '50%', right: '5%', transform: 'translateY(-50%)' }
  };

  if (customPosition) {
    return { top: customPosition.y, left: customPosition.x };
  }

  return presets[position] || presets.center;
}

// Size calculation helpers
export function getSizeStyles(size, maxWidth, maxHeight) {
  const presets = {
    small: { maxWidth: '30vw', maxHeight: '30vh' },
    medium: { maxWidth: '50vw', maxHeight: '50vh' },
    large: { maxWidth: '70vw', maxHeight: '70vh' },
    fullscreen: { width: '100vw', height: '100vh' }
  };

  const base = presets[size] || presets.large;
  
  return {
    ...base,
    ...(maxWidth && { maxWidth }),
    ...(maxHeight && { maxHeight })
  };
}
```

### Migration Strategy
1. **Backward compatible** - Existing jokes.json files work without changes
2. **Gradual adoption** - Add animation configs to jokes one at a time
3. **Sensible defaults** - If animation config missing, use current behavior (fade + scale)
4. **Validation** - Warn in console if invalid animation type specified

### Example Joke Configurations

#### Dramatic Entrance
```json
{
  "id": "boom",
  "hotkey": "1",
  "type": "image",
  "src": "./assets/explosion.gif",
  "animation": {
    "entry": "zoom",
    "exit": "shrink",
    "duration": 600,
    "easing": "spring"
  },
  "size": "fullscreen",
  "displayDuration": 2000
}
```

#### Corner Notification
```json
{
  "id": "notification",
  "hotkey": "2",
  "type": "text",
  "text": "🔔 New message!",
  "animation": {
    "entry": "slideInRight",
    "exit": "slideOutRight",
    "duration": 400,
    "easing": "easeOut"
  },
  "position": "top-right",
  "size": "small",
  "displayDuration": 1500
}
```

#### Spinning Joke
```json
{
  "id": "spin",
  "hotkey": "3",
  "type": "image",
  "src": "./assets/dizzy.gif",
  "animation": {
    "entry": "spin",
    "exit": "spinOut",
    "duration": 800,
    "easing": "easeInOut"
  },
  "rotation": 15,
  "displayDuration": 2000
}
```

### Testing Requirements
- [ ] All animation types work smoothly
- [ ] Position presets place jokes correctly
- [ ] Size presets scale appropriately
- [ ] Custom positioning works
- [ ] Rotation applies correctly
- [ ] Easing functions feel natural
- [ ] Backward compatibility maintained
- [ ] Performance stays at 60fps
- [ ] Works across different screen sizes

### Deliverables
- [ ] `jokeAnimations.js` utility library
- [ ] Updated `JokeOverlay.jsx` with Framer Motion
- [ ] Animation variant definitions for all types
- [ ] Position and size calculation helpers
- [ ] Updated demo jokes.json with examples
- [ ] Documentation for joke configuration
- [ ] Migration guide for existing jokes

---

## Phase 4: Desktop Wrapper (Sprint 4)

### Goal
Package as native desktop app with Tauri.

### New Dependencies
- `@tauri-apps/cli` - Tauri CLI
- `@tauri-apps/api` - Tauri JS API

### Tauri Features
1. **File Dialog** - Open deck folder
2. **Recent Decks** - Store in local storage
3. **Kiosk Mode** - Fullscreen, no chrome
4. **Global Hotkeys** - System-wide shortcuts (opt-in)
5. **Multi-Window** - Native presenter view

### File Structure Additions
```
/src-tauri
  /src
    main.rs                 # Tauri backend
    /commands
      deck.rs               # Deck file operations
      window.rs             # Window management
  tauri.conf.json
  Cargo.toml
```

### Tauri Configuration
```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "tauri": {
    "allowlist": {
      "fs": {
        "scope": ["$HOME/Documents/LiveSlides/**"]
      },
      "dialog": {
        "open": true
      },
      "window": {
        "create": true,
        "setFullscreen": true
      },
      "globalShortcut": {
        "all": true
      }
    }
  }
}
```

### Rust Commands
```rust
// Open deck folder picker
#[tauri::command]
async fn open_deck_folder() -> Result<String, String> {
  // Returns path to selected folder
}

// Create presenter window
#[tauri::command]
async fn create_presenter_window(app: tauri::AppHandle) -> Result<(), String> {
  // Creates new window with presenter.html
}

// Register global hotkeys (opt-in)
#[tauri::command]
async fn register_global_hotkeys(shortcuts: Vec<String>) -> Result<(), String> {
  // Registers system-wide shortcuts
}
```

### Deliverables
- [ ] Tauri initialized
- [ ] File dialog opens deck folders
- [ ] Recent decks stored and displayed
- [ ] Kiosk mode toggle works
- [ ] Multi-window presenter view (native)
- [ ] Global hotkeys (opt-in per deck)
- [ ] Builds for macOS/Windows/Linux
- [ ] App icon and metadata
- [ ] Installer/DMG/AppImage

---

## Critical Technical Decisions

### 1. MDX Compilation Strategy
**Decision: Runtime compilation for MVP, build-time optimization later**
- Allows loading arbitrary deck folders
- Trade-off: ~200ms initial load time
- Future: Precompile popular decks

### 2. Asset Path Resolution
**Decision: Relative paths from deck.json location**
```javascript
// deck.json at /talks/2025-launch/deck.json
// Asset at /talks/2025-launch/assets/logo.png
// Reference in MDX: ./assets/logo.png
// Resolved to: /talks/2025-launch/assets/logo.png
```

### 3. Joke Media Preloading
**Decision: Preload all on deck load**
- Small file sizes (<5MB total typical)
- Guarantees <100ms display time
- Show loading indicator if not ready

### 4. Presenter Window Communication
**Decision: postMessage for web, Tauri events for desktop**
```javascript
if (window.__TAURI__) {
  // Use Tauri event system
  emit('slide-change', data)
} else {
  // Use postMessage
  presenterWindow.postMessage(data, '*')
}
```

### 5. Styling Approach
**Decision: Tailwind CSS**
- Rapid prototyping
- Built-in responsive utilities
- Easy theming with CSS variables
- Smaller learning curve than CSS Modules

### 6. State Management
**Decision: React Context + hooks, no Redux/Zustand**
- Simple state needs (deck, index, jokes)
- Context for deck-wide state
- Local state for UI interactions
- Avoids over-engineering

---

## Testing Strategy

### Unit Tests (Vitest)
- `deckLoader.js` - JSON parsing, path resolution
- `useSlideNavigation.js` - Bounds checking, navigation logic
- `useJokeManager.js` - Hotkey mapping, cooldown logic
- Slide components - Prop validation, rendering

### Integration Tests (Vitest + Testing Library)
- Keyboard navigation flow
- Fullscreen toggle
- Joke overlay lifecycle
- Presenter window sync

### E2E Tests (Playwright)
- Load demo deck
- Navigate all slides
- Trigger all joke types
- Open presenter view
- Test in fullscreen

### Manual Testing Checklist
- [ ] All slide types render correctly
- [ ] Transitions smooth at 60fps
- [ ] Iframes load and are interactive
- [ ] YouTube embeds play
- [ ] Jokes display within 100ms
- [ ] Presenter view stays in sync
- [ ] Works in Chrome, Firefox, Safari
- [ ] Desktop build opens and runs

---

## Performance Targets

- **Initial load**: <1s for 20-slide deck
- **Slide transition**: 60fps, <350ms duration
- **Joke display**: <100ms from keypress
- **MDX compilation**: <200ms per slide
- **Bundle size**: <500KB (before deck content)
- **Memory**: <100MB for typical deck

---

## Open Implementation Questions

### 1. MDX Component Scope
Should MDX slides have access to:
- All React hooks? (Yes, for flexibility)
- Deck state? (No, keep slides pure)
- Navigation controls? (No, use hotkeys only)

**Proposal: Provide safe subset via context**

### 2. Joke Interrupt Behavior
If joke A is showing and user presses joke B:
- Option A: Queue B after A finishes
- Option B: Interrupt A, show B immediately
- Option C: Ignore B until A finishes

**Proposal: Option B with 200ms cooldown**

### 3. Asset Caching Strategy
For web build, should we:
- Cache all assets in Service Worker?
- Use browser cache only?
- Preload critical assets only?

**Proposal: Preload next slide assets only**

### 4. Error Recovery
If MDX compilation fails:
- Show error slide with details?
- Skip slide and log error?
- Halt presentation?

**Proposal: Show error slide, allow navigation**

---

## Build Order (Recommended)

### Week 1: Foundation
1. Initialize Vite + React + Tailwind
2. Build slide components (text, image, YouTube, iframe)
3. Implement navigation hooks
4. Add transitions (CSS only)
5. Test with hardcoded slides

### Week 2: File Loading
1. Add MDX support to Vite
2. Build deck loader
3. Create MDX primitives
4. Implement layouts
5. Convert demo deck to MDX

### Week 3: Showtime Features
1. Add Framer Motion
2. Build joke system
3. Implement preloading
4. Create presenter view
5. Add postMessage sync

### Week 4: Desktop & Polish
1. Initialize Tauri
2. Add file dialogs
3. Implement multi-window
4. Add global hotkeys
5. Build and test installers

---

## Success Criteria

### MVP (End of Week 2)
✅ Can present a deck with mixed slide types
✅ Keyboard navigation works smoothly
✅ Fullscreen mode works
✅ Loads from deck.json + MDX files
✅ Responsive on different screen sizes

### V1 (End of Week 4)
✅ Jokes trigger instantly and look great
✅ Presenter view keeps me on track
✅ Desktop app feels native
✅ Can record with OBS without issues
✅ Friends can use it without my help

---

## Next Steps

1. **Review this plan** - Does it align with your vision?
2. **Initialize project** - Set up Vite + React + Tailwind
3. **Build Phase 1** - Get basic slideshow working
4. **Iterate** - Test, refine, add features

Ready to start coding?
