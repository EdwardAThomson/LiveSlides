import { useState, useRef, useEffect } from 'react';

/**
 * DeckSelector - Dropdown menu for selecting presentation decks
 */
export default function DeckSelector({ decks, currentDeck, onSelectDeck }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const currentDeckInfo = decks.find(d => d.id === currentDeck);

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
          bg-white/10
          backdrop-blur-sm
          hover:bg-white/20
          transition-colors
          text-white text-sm
          border border-white/20
        "
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
          bg-gray-900/95
          backdrop-blur-md
          border border-white/20
          shadow-2xl
          overflow-hidden
        ">
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
                ${deck.id === currentDeck 
                  ? 'bg-blue-500/30 text-white' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="text-xl">{deck.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{deck.name}</div>
                {deck.description && (
                  <div className="text-xs text-white/60 mt-0.5">{deck.description}</div>
                )}
              </div>
              {deck.id === currentDeck && (
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
