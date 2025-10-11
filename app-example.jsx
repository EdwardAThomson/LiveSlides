import React, { useMemo, useRef, useState, useEffect } from "react";

// --- Minimal React slideshow MVP ---
// Features:
// - Slide schema supports: image, youtube, iframe/app, markdown-ish text
// - Keyboard (←/→), click, and on-screen controls
// - Simple animated transitions (fade/slide)
// - Fullscreen toggle (F)
// - Local image support via file picker (creates object URLs at runtime)
// - App embeds via <iframe> (e.g., your local dev server or hosted app)
//
// Notes:
// - For YouTube, use the watch?v=... ID; we embed the player in privacy-enhanced mode
// - For local images, click the 📁 button and select one or more files; they appear as new slides
// - For best results run under Vite: `npm create vite@latest`, choose React, paste this as App.jsx, run `npm run dev`
// - To package as a native desktop app later, wrap with Tauri or Electron; this UI already works fullscreen

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const SlideChrome = ({ children, onPrev, onNext, index, total, onToggleFS, onAddImages }) => {
  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center select-none">
        {children}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-xl text-sm">
        <button onClick={onPrev} title="Prev" className="px-2 py-1 rounded hover:bg-white/10">◀</button>
        <div className="opacity-80 tabular-nums">{index + 1} / {total}</div>
        <button onClick={onNext} title="Next" className="px-2 py-1 rounded hover:bg-white/10">▶</button>
        <div className="mx-2 w-px bg-white/20 h-5" />
        <button onClick={onToggleFS} title="Fullscreen (F)" className="px-2 py-1 rounded hover:bg-white/10">⛶</button>
        <button onClick={onAddImages} title="Add local images" className="px-2 py-1 rounded hover:bg-white/10">📁</button>
      </div>
    </div>
  );
};

const Transition = ({ kind, active, children }) => {
  // Simple CSS-in-JS transitions; could swap for Framer Motion later
  const base = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem",
  };
  const stylesByKind = {
    fade: {
      transition: "opacity 300ms ease",
      opacity: active ? 1 : 0,
    },
    slide: {
      transition: "transform 350ms ease, opacity 350ms ease",
      transform: `translateX(${active ? 0 : 40}%)`,
      opacity: active ? 1 : 0,
    },
  };
  return <div style={{ ...base, ...stylesByKind[kind || "fade"] }}>{children}</div>;
};

// --- Slide Renderers ---
const TextSlide = ({ html }) => (
  <div className="max-w-5xl mx-auto text-center">
    <div className="text-5xl font-semibold mb-6" dangerouslySetInnerHTML={{ __html: html.title }} />
    {html.body && (
      <div className="text-2xl leading-relaxed opacity-90" dangerouslySetInnerHTML={{ __html: html.body }} />
    )}
  </div>
);

const ImageSlide = ({ src, alt }) => (
  <img src={src} alt={alt || "slide image"} className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" />
);

const YouTubeSlide = ({ id, start = 0 }) => (
  <div className="w-[90vw] h-[70vh]">
    <iframe
      className="w-full h-full rounded-xl shadow-2xl"
      src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&start=${start}`}
      title="YouTube video"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  </div>
);

const IframeSlide = ({ src }) => (
  <div className="w-[95vw] h-[80vh] bg-black">
    <iframe className="w-full h-full rounded-xl border-0 shadow-2xl bg-white" src={src} />
  </div>
);

// --- Slide Model ---
// type: "text" | "image" | "youtube" | "iframe"
// Minimal seed deck to demonstrate each type
const seedSlides = [
  {
    id: "intro",
    type: "text",
    html: {
      title: "Make your presentations <em>come alive</em>",
      body: "<p>React-based deck with images, apps, and videos. Use ←/→, click, or controls below. Press <kbd>F</kbd> for fullscreen.</p>",
    },
  },
  {
    id: "img-demo",
    type: "image",
    src: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1600",
    alt: "demo image",
  },
  {
    id: "yt-demo",
    type: "youtube",
    youtubeId: "dQw4w9WgXcQ",
    start: 0,
  },
  {
    id: "app-demo",
    type: "iframe",
    src: "https://example.org", // replace with your local dev server, e.g. http://localhost:5173
  },
];

export default function App() {
  const [slides, setSlides] = useState(seedSlides);
  const [idx, setIdx] = useState(0);
  const [transitionKind, setTransitionKind] = useState("fade");
  const [animKey, setAnimKey] = useState(0);
  const containerRef = useRef(null);

  const count = slides.length;
  const current = slides[idx];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key.toLowerCase() === "f") toggleFS();
      if (e.key.toLowerCase() === "s") setTransitionKind((k) => (k === "fade" ? "slide" : "fade"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, slides]);

  const prev = () => {
    setIdx((i) => clamp(i - 1, 0, count - 1));
    setAnimKey((k) => k + 1);
  };
  const next = () => {
    setIdx((i) => clamp(i + 1, 0, count - 1));
    setAnimKey((k) => k + 1);
  };

  const toggleFS = async () => {
    const el = containerRef.current || document.documentElement;
    if (!document.fullscreenElement) await el.requestFullscreen().catch(() => {});
    else await document.exitFullscreen().catch(() => {});
  };

  const addLocalImages = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      const newSlides = files.map((f) => ({ id: `local-${f.name}-${crypto.randomUUID()}`, type: "image", src: URL.createObjectURL(f), alt: f.name }));
      setSlides((s) => [...s, ...newSlides]);
      setIdx((i) => (i === 0 ? 0 : i));
    };
    input.click();
  };

  const render = (s) => {
    switch (s.type) {
      case "text":
        return <TextSlide html={s.html} />;
      case "image":
        return <ImageSlide src={s.src} alt={s.alt} />;
      case "youtube":
        return <YouTubeSlide id={s.youtubeId} start={s.start} />;
      case "iframe":
        return <IframeSlide src={s.src} />;
      default:
        return <div>Unknown slide type</div>;
    }
  };

  return (
    <div ref={containerRef} className="w-screen h-screen" onClick={(e) => {
      // click-to-advance unless clicking controls or interactable iframe
      const target = e.target;
      const interactive = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT", "IFRAME"];
      if (!interactive.includes(target.tagName)) next();
    }}>
      <SlideChrome
        index={idx}
        total={count}
        onPrev={(e) => { e?.stopPropagation?.(); prev(); }}
        onNext={(e) => { e?.stopPropagation?.(); next(); }}
        onToggleFS={(e) => { e?.stopPropagation?.(); toggleFS(); }}
        onAddImages={(e) => { e?.stopPropagation?.(); addLocalImages(); }}
      >
        {/* Keyed container to retrigger entry transition */}
        <Transition key={current?.id + ":" + animKey} kind={transitionKind} active>
          {render(current)}
        </Transition>
      </SlideChrome>

      {/* Tiny HUD top-left */}
      <div className="absolute top-3 left-3 text-xs text-white/70">
        <span className="px-2 py-1 rounded bg-white/10">Transition: {transitionKind} (press "S" to toggle)</span>
      </div>
    </div>
  );
}
