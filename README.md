# LiveSlides

A lightweight, presenter-friendly slide app for YouTube and live demos. Author slides in Markdown/MDX, embed live web apps, images, and videos, trigger quick "joke" overlays with hotkeys, and ship as a web app or desktop app (Tauri) with fullscreen/kiosk support.

##  Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

**👉 [Read the Getting Started Guide](./GETTING_STARTED.md)** for a complete walkthrough!

##  Transitions

Press **S** to cycle through 4 smooth transition styles:
- **Fade** - Classic crossfade
- **Slide** - Slides in from right, exits left
- **Scale** - Zooms in/out with fade
- **SlideUp** - Bounces up with spring physics

All transitions use Framer Motion for buttery-smooth 60fps animations!

##  Keyboard Shortcuts

- **←/→ or Space** - Navigate slides
- **F** - Toggle fullscreen
- **S** - Cycle transitions (fade → slide → scale → slideUp)
- **1, 2, 3, Q** - Trigger joke overlays (when available)
- **Escape** - Exit fullscreen
- **Click** - Advance to next slide
- **Swipe** - Navigate on touch devices

##  Project Structure

```
src/
├── components/
│   ├── SlideChrome.jsx      # Main container with controls
│   ├── Transition.jsx        # Transition animations
│   └── slides/               # Slide type components
│       ├── TextSlide.jsx
│       ├── ImageSlide.jsx
│       ├── YouTubeSlide.jsx
│       └── IframeSlide.jsx
├── hooks/
│   ├── useSlideNavigation.js # Navigation logic
│   └── useKeyboardNav.js     # Keyboard handling
└── App.jsx                   # Main app component
```
##  Current Status: Phase 3 Complete ✨

**Phase 1 - Core Engine:**
-  All 4 slide types (Text, Image, YouTube, Iframe)
-  Keyboard navigation & click-to-advance
-  Fullscreen support

**Phase 2 - MDX & Deck Loading:**
-  Deck loader (deck.json + MDX files)
-  MDX primitives (Grid, Block, Media, Iframe, YouTube, Callout)
-  Layout system (center, split-40-60, split-60-40, three-up, full)
-  Frontmatter support for slide notes
-  Multiple deck switching

**Phase 3 - Polish & Interactivity:**
-  Joke overlays with hotkeys (1, 2, 3, Q)
-  Framer Motion animations (4 transition types)
-  Stagger animations for MDX content
-  Touch/swipe gesture support
-  Smooth exit animations

**Next Phase (Sprint 4):**
-  Presenter view with notes & timer
-  Tauri desktop build
-  Advanced slide types (Terminal, Code highlighting, Charts)

##  Documentation

- **Product Plan:** `live_slides_product_tech_plan.md`
- **Implementation Plan:** `IMPLEMENTATION.md`

##  Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **MDX** - Markdown with JSX for slide authoring
- **Framer Motion** - Smooth animations & transitions

## 🎯 Quick Start: Build Your Presentation

### Your presentation is ready to edit!

**Start here:** `src/decks/my-presentation/`

This folder contains a template presentation with 4 slides:
1. **Title slide** - Edit your name and topic
2. **Content slide** - Add your key points
3. **Demo slide** - Show side-by-side content
4. **Closing slide** - Thank you and contact info

### How to edit:

1. Open `src/decks/my-presentation/slides/01-title.mdx`
2. Edit the Markdown content
3. Save the file
4. The browser will auto-reload with your changes!

### File structure:
```
src/decks/my-presentation/
├── index.js              # Don't touch - imports all slides
├── deck.json             # Slide order and layouts
├── slides/
│   ├── 01-title.mdx      ← Edit these files!
│   ├── 02-content.mdx
│   ├── 03-demo.mdx
│   └── 04-closing.mdx
└── assets/
    └── images/           ← Put your images here
```

### Adding more slides:

1. Create a new `.mdx` file in `slides/` folder
2. Add it to `deck.json` slides array
3. Import it in `index.js`
4. Add it to the `mdxModules` object

See `src/decks/demo-deck/` for more examples of what's possible!
