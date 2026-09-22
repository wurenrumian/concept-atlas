import React, { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { SKINS, COMPONENT_STYLES } from '../model/skins.js';

function OptionButton({ selected, onClick, children, label }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={`skin-option ${selected ? 'active' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {children}
      {selected && <Check size={14} />}
    </button>
  );
}

export function SkinPicker({ skin, style, onSkinChange, onStyleChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      // Stop Escape from also reaching the window-level handler in App.jsx,
      // which navigates to the parent node.
      event.stopPropagation();
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="skin-picker" ref={rootRef}>
      <button
        type="button"
        className="skin-picker-btn"
        onClick={() => setOpen(value => !value)}
        aria-label="外观设置：配色与组件风格"
        title="外观设置：配色与组件风格"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Palette size={17} />
      </button>
      {open && (
        <div className="skin-picker-menu" role="listbox" aria-label="外观设置">
          <div className="skin-picker-group">配色</div>
          {SKINS.map(item => (
            <OptionButton
              key={item.id}
              selected={item.id === skin}
              label={`配色 ${item.label}`}
              onClick={() => { onSkinChange(item.id); setOpen(false); }}
            >
              <span
                className="skin-swatch"
                style={{ background: `linear-gradient(135deg, ${item.swatch.dark} 0 42%, ${item.swatch.accent} 42% 58%, ${item.swatch.light} 58% 100%)` }}
                aria-hidden="true"
              />
              <span className="skin-option-label">{item.label}</span>
            </OptionButton>
          ))}
          <div className="skin-picker-group">组件风格</div>
          {COMPONENT_STYLES.map(item => (
            <OptionButton
              key={item.id}
              selected={item.id === style}
              label={`组件风格 ${item.label}`}
              onClick={() => { onStyleChange(item.id); setOpen(false); }}
            >
              <span className={`style-glyph style-glyph-${item.id}`} aria-hidden="true" />
              <span className="skin-option-label">{item.label}</span>
            </OptionButton>
          ))}
        </div>
      )}
    </div>
  );
}

SkinPicker.displayName = 'SkinPicker';
