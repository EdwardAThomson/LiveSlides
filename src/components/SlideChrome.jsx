import CameraOverlay from './CameraOverlay';

export default function SlideChrome({ 
  children, 
  onPrev, 
  onNext, 
  currentIndex, 
  totalSlides,
  onToggleFullscreen,
  canGoPrev,
  canGoNext,
  cameraOverlay,
}) {
  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative">
      {/* Main slide content area */}
      <div className="absolute inset-0 flex items-center justify-center select-none">
        {children}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl text-sm shadow-lg z-50">
        <button 
          onClick={onPrev}
          disabled={!canGoPrev}
          title="Previous (←)"
          className="px-3 py-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ◀
        </button>
        
        <div className="opacity-80 tabular-nums min-w-[60px] text-center">
          {currentIndex + 1} / {totalSlides}
        </div>
        
        <button 
          onClick={onNext}
          disabled={!canGoNext}
          title="Next (→ or Space)"
          className="px-3 py-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ▶
        </button>
        
        <div className="mx-1 w-px bg-white/20 h-6" />
        
        <button 
          onClick={onToggleFullscreen}
          title="Fullscreen (F)"
          className="px-3 py-1.5 rounded hover:bg-white/10 transition-all"
        >
          ⛶
        </button>
      </div>

      {/* Camera overlay mask */}
      <CameraOverlay config={cameraOverlay} />
    </div>
  );
}
