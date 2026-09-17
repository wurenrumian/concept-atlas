import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SKIN, normalizeSkin, DEFAULT_STYLE, normalizeStyle } from '../model/skins.js';

const STORAGE_KEY = 'concept_atlas_appearance';
const LEGACY_KEYS = ['concept_atlas_theme', 'concept_atlas_scroll_theme'];

function normalizeMode(value) {
  return value === 'light' ? 'light' : 'dark';
}

/**
 * Compile-time defaults injected via Vite `define` (CLI --skin/--default-mode
 * or CONCEPT_ATLAS_* env vars). Absent defines resolve to the carrier fallbacks.
 */
const BUILD_DEFAULT_SKIN = typeof __ATLAS_DEFAULT_SKIN__ === 'string'
  ? (normalizeSkin(__ATLAS_DEFAULT_SKIN__) || DEFAULT_SKIN)
  : DEFAULT_SKIN;
const BUILD_DEFAULT_MODE = typeof __ATLAS_DEFAULT_MODE__ === 'string' && (__ATLAS_DEFAULT_MODE__ === 'dark' || __ATLAS_DEFAULT_MODE__ === 'light')
  ? __ATLAS_DEFAULT_MODE__
  : null;
const BUILD_DEFAULT_STYLE = typeof __ATLAS_DEFAULT_STYLE__ === 'string'
  ? (normalizeStyle(__ATLAS_DEFAULT_STYLE__) || DEFAULT_STYLE)
  : DEFAULT_STYLE;

function readStoredAppearance(fallbackMode) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        skin: normalizeSkin(parsed?.skin) || BUILD_DEFAULT_SKIN,
        mode: normalizeMode(parsed?.mode),
        style: normalizeStyle(parsed?.style) || BUILD_DEFAULT_STYLE,
      };
    }
  } catch {
    // Corrupted payload falls through to legacy/default handling.
  }
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy === 'dark' || legacy === 'light') {
      return { skin: BUILD_DEFAULT_SKIN, mode: legacy, style: BUILD_DEFAULT_STYLE };
    }
  }
  return { skin: BUILD_DEFAULT_SKIN, mode: normalizeMode(fallbackMode), style: BUILD_DEFAULT_STYLE };
}

/**
 * Shared appearance state for both carriers (atlas & scroll): palette
 * (`data-skin`) x mode (`data-theme`) x component style pack (`data-style`).
 * Applies the attributes on <html> and persists the choice under one
 * localStorage key so both pages stay in sync.
 */
export function useAppearance({ defaultMode = 'dark' } = {}) {
  const [appearance, setAppearance] = useState(() => readStoredAppearance(BUILD_DEFAULT_MODE || defaultMode));

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', appearance.skin);
    document.documentElement.setAttribute('data-theme', appearance.mode);
    document.documentElement.setAttribute('data-style', appearance.style);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      // Storage may be unavailable (private mode); switching still works in-memory.
    }
  }, [appearance]);

  const setSkin = useCallback((skin) => {
    setAppearance(prev => ({ ...prev, skin: normalizeSkin(skin) || prev.skin }));
  }, []);
  const setMode = useCallback((mode) => {
    setAppearance(prev => ({ ...prev, mode: normalizeMode(mode) }));
  }, []);
  const toggleMode = useCallback(() => {
    setAppearance(prev => ({ ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' }));
  }, []);
  const setStyle = useCallback((style) => {
    setAppearance(prev => ({ ...prev, style: normalizeStyle(style) || prev.style }));
  }, []);

  return { skin: appearance.skin, mode: appearance.mode, style: appearance.style, setSkin, setMode, toggleMode, setStyle };
}
