import React, { useEffect, useMemo, useRef, useState } from 'react';

const normalizeParts = (value) =>
  String(value || '')
    .split(/[^\d]+/)
    .filter(Boolean);

const FirstShotInput = ({ value, onChange, participants, placeholder = '1,4,10' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const options = useMemo(
    () =>
      participants.map((participant, index) => ({
        seat: index + 1,
        selected: normalizeParts(value).includes(String(index + 1)),
        empty: !participant.playerId,
      })),
    [participants, value]
  );

  const handleSelect = (seat) => {
    const currentParts = normalizeParts(value);
    if (currentParts.includes(String(seat))) return;

    const nextParts = [...currentParts, String(seat)].slice(0, 3);
    onChange(nextParts.join(','));
    setIsOpen(true);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        style={{
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          padding: '10px',
          borderRadius: '6px',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      />

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: '96px',
            maxHeight: '220px',
            overflowY: 'auto',
            background: '#262626',
            border: '1px solid #444',
            borderRadius: '8px',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.35)',
            zIndex: 20,
          }}
        >
          {options.map((option) => (
            <button
              key={option.seat}
              type="button"
              onClick={() => handleSelect(option.seat)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: option.selected ? 'rgba(45, 90, 39, 0.35)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderBottom: '1px solid #3a3a3a',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '13px',
                opacity: option.empty ? 0.65 : 1,
              }}
            >
              <span>№ {option.seat}</span>
              <span style={{ color: option.selected ? '#9be28f' : '#888', fontWeight: 'bold' }}>
                {option.selected ? '✓' : option.empty ? '○' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FirstShotInput;
