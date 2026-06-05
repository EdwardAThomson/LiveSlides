import { useRef, useState, useLayoutEffect } from 'react';

// Fixed slide canvas. All slide content (and the camera overlay) is laid out
// against this reference size, then scaled uniformly to fit whatever view it's
// shown in — so a pixel means the same fraction of the slide everywhere, and
// the presenter preview is a faithful WYSIWYG of the Stage window.
export const SLIDE_W = 1280;
export const SLIDE_H = 720;

/**
 * Measures its own box and renders a fixed SLIDE_W×SLIDE_H canvas scaled to fit
 * (contain), centred — letterboxing if the box isn't 16:9.
 */
export default function SlideStage({ children, className = '', style }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / SLIDE_W, height / SLIDE_H) || 0);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={style}>
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
