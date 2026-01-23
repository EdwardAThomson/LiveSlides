import { useState, useRef, useEffect } from 'react';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

/**
 * DeckSelector - Dropdown menu for selecting presentation decks
 * Supports both bundled decks and external decks from the registry (Tauri only)
 */
export default function DeckSelector({
  decks,
  currentDeck,
  onSelectDeck,
  externalDecks = [],
  onAddDeck,
  onSelectExternalDeck,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingDeck, setIsAddingDeck] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (deckId) => {
    onSelectDeck(deckId);
    setIsOpen(false);
  };

  const handleSelectExternal = (deck) => {
    if (onSelectExternalDeck) {
      onSelectExternalDeck(deck);
    }
    setIsOpen(false);
  };

  const handleAddDeck = async () => {
    if (onAddDeck) {
      setIsAddingDeck(true);
      try {
        await onAddDeck();
      } finally {
        setIsAddingDeck(false);
      }
    }
    setIsOpen(false);
  };

  // Find current deck info from either bundled or external decks
  const currentDeckInfo = decks.find(d => d.id === currentDeck) ||
    externalDecks.find(d => d.id === currentDeck);

  const showExternalSection = isTauri() && (externalDecks.length > 0 || onAddDeck);

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Dropdown Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="
          flex items-center gap-2
          px-4 py-2
          rounded-lg
          transition-colors
          text-sm
        "
        style={{
          backgroundColor: 'var(--bg-chrome)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-main)'
        }}
      >
        <span className="text-lg">{currentDeckInfo?.icon || '📊'}</span>
        <span className="font-medium">{currentDeckInfo?.name || 'Select Deck'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-2
          min-w-[240px]
          rounded-lg
          backdrop-blur-md
          shadow-2xl
          overflow-hidden
          border
        "
          style={{
            backgroundColor: 'var(--bg-chrome)',
            borderColor: 'var(--border-main)'
          }}
        >
          {/* Bundled Decks */}
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(deck.id);
              }}
              className={`
                w-full
                flex items-center gap-3
                px-4 py-3
                text-left
                transition-colors
              `}
              style={{
                backgroundColor: deck.id === currentDeck ? 'var(--bg-surface)' : 'transparent',
                color: deck.id === currentDeck ? 'var(--accent-primary)' : 'var(--text-main)'
              }}
            >
              <span className="text-xl">{deck.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{deck.name}</div>
                {deck.description && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{deck.description}</div>
                )}
              </div>
              {deck.id === currentDeck && (
                <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}

          {/* External Decks Section (Tauri only) */}
          {showExternalSection && (
            <>
              <div className="border-t border-white/10 my-1" />
              <div className="px-4 py-2 text-xs text-white/40 uppercase tracking-wide">
                Your Decks
              </div>
              {externalDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectExternal(deck);
                  }}
                  className={`
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left
                    transition-colors
                    ${deck.id === currentDeck
                      ? 'bg-blue-500/30 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">📁</span>
                  <div className="flex-1">
                    <div className="font-medium">{deck.name}</div>
                    <div className="text-xs text-white/40 mt-0.5 truncate max-w-[180px]">
                      {deck.path}
                    </div>
                  </div>
                  {deck.id === currentDeck && (
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Add Deck Button */}
              {onAddDeck && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddDeck();
                  }}
                  disabled={isAddingDeck}
                  className="
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left
                    transition-colors
                    text-white/60 hover:bg-white/10 hover:text-white
                    disabled:opacity-50
                  "
                >
                  <span className="text-xl">{isAddingDeck ? '⏳' : '➕'}</span>
                  <div className="font-medium">
                    {isAddingDeck ? 'Opening...' : 'Add Deck Folder...'}
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
