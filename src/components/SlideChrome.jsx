import CameraOverlay from './CameraOverlay';

export default function SlideChrome({
  children,
  onPrev,
  onNext,
  currentIndex,
  totalSlides,
  onToggleFullscreen,
  onToggleCameraOverlay,
  canGoPrev,
  canGoNext,
  cameraOverlay,
  cameraOverlayVisible,
}) {
  return (
    <div
      className="w-full h-screen overflow-hidden relative transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-slide)', color: 'var(--text-main)' }}
    >
      {/* Main slide content area */}
      <div className="absolute inset-0 flex items-center justify-center select-none">
        {children}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl text-lg shadow-lg z-50">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          title="Previous (←)"
          className="px-5 py-3 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-2xl"
        >
          ◀
        </button>

        <div className="opacity-80 tabular-nums min-w-[80px] text-center text-xl font-medium">
          {currentIndex + 1} / {totalSlides}
        </div>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          title="Next (→ or Space)"
          className="px-5 py-3 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-2xl"
        >
          ▶
        </button>

        <div className="mx-2 w-px bg-white/20 h-8" />

        <button
          onClick={onToggleFullscreen}
          title="Fullscreen (F)"
          className="px-4 py-3 rounded-lg hover:bg-white/20 transition-all text-2xl"
        >
          ⛶
        </button>

        {/* Camera overlay toggle - always available */}
        <div className="mx-2 w-px bg-white/20 h-8" />
        <button
          onClick={onToggleCameraOverlay}
          title="Toggle Camera Overlay (C)"
          className={`px-4 py-3 rounded-lg hover:bg-white/20 transition-all text-2xl ${cameraOverlayVisible ? '' : 'opacity-50'}`}
        >
          📹
        </button>
      </div>

      {/* Camera overlay mask */}
      <CameraOverlay config={cameraOverlay} visible={cameraOverlayVisible} />
    </div>
  );
}
