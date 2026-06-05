import { useState } from 'react';
import { pxToNum } from '../lib/overlaySettings';

const POSITIONS = [
  { id: 'top-left', label: '↖' },
  { id: 'top-right', label: '↗' },
  { id: 'bottom-left', label: '↙' },
  { id: 'bottom-right', label: '↘' },
];

function Slider({ label, value, min, max, step = 10, onChange }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="text-sm tabular-nums" style={{ color: 'var(--text-main)' }}>{value}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
    </label>
  );
}

/**
 * Right-side drawer for editing the active deck's camera overlay. Edits are
 * applied live (onChange) so the preview + Stage update as you drag.
 */
export default function CameraSettings({
  open,
  onClose,
  config,
  onChange,
  onReset,
  onSaveToDeck,
  canSaveToDeck,
}) {
  const [lockAspect, setLockAspect] = useState(false);
  const [ratio, setRatio] = useState(16 / 9);

  if (!open || !config) return null;

  const width = pxToNum(config.width, 420);
  const height = pxToNum(config.height, 240);
  const margin = pxToNum(config.margin, 0);
  const set = (patch) => onChange({ ...config, ...patch });

  // When the aspect ratio is locked, dragging either dimension scales the
  // overlay proportionally (so it stays the same shape — e.g. a 16:9 camera).
  const setWidth = (v) =>
    set(lockAspect ? { width: `${v}px`, height: `${Math.round(v / ratio)}px` } : { width: `${v}px` });
  const setHeight = (v) =>
    set(lockAspect ? { width: `${Math.round(v * ratio)}px`, height: `${v}px` } : { height: `${v}px` });
  const toggleLock = (on) => {
    if (on) setRatio(height ? width / height : 16 / 9);
    setLockAspect(on);
  };

  return (
    <div
      className="fixed right-0 top-0 h-screen w-80 z-50 p-4 overflow-y-auto border-l shadow-2xl flex flex-col gap-5"
      style={{ backgroundColor: 'var(--bg-chrome)', borderColor: 'var(--border-main)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <span>📹</span> Camera Overlay
        </h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-lg" title="Close">✕</button>
      </div>

      {/* Position */}
      <div>
        <span className="text-sm font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>Position</span>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONS.map((p) => {
            const active = (config.position || 'bottom-left') === p.id;
            return (
              <button
                key={p.id}
                onClick={() => set({ position: p.id })}
                className="py-2 rounded-lg text-xl transition-all border"
                style={{
                  backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-main)',
                  color: active ? 'white' : 'var(--text-main)',
                }}
                title={p.id}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size (relative to the 1280×720 slide canvas) */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Lock aspect ratio</span>
        <input
          type="checkbox"
          checked={lockAspect}
          onChange={(e) => toggleLock(e.target.checked)}
          className="w-5 h-5 accent-purple-500"
        />
      </label>
      <Slider label="Width" value={width} min={120} max={1280} onChange={setWidth} />
      <Slider label="Height" value={height} min={80} max={720} onChange={setHeight} />
      <Slider label="Margin" value={margin} min={0} max={200} onChange={(v) => set({ margin: `${v}px` })} />

      {/* Fill / outline */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Gradient fill</span>
        <input
          type="checkbox"
          checked={config.gradient !== false}
          onChange={(e) => set({ gradient: e.target.checked })}
          className="w-5 h-5 accent-purple-500"
        />
      </label>
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Border</span>
        <input
          type="checkbox"
          checked={config.border === true}
          onChange={(e) => set({ border: e.target.checked })}
          className="w-5 h-5 accent-purple-500"
        />
      </label>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <button
          onClick={onReset}
          className="py-2 px-4 rounded-lg font-semibold transition-colors border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-main)' }}
        >
          Reset to deck default
        </button>
        {canSaveToDeck && (
          <button
            onClick={onSaveToDeck}
            className="py-2 px-4 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
            title="Write these settings into the deck's deck.json"
          >
            💾 Save to deck file
          </button>
        )}
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          Saved per-deck in this browser. {canSaveToDeck ? 'Use “Save to deck file” to bake into the deck folder.' : ''}
        </p>
      </div>
    </div>
  );
}
