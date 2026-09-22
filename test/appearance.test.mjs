import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

/**
 * readStoredAppearance used to call localStorage for the legacy keys outside
 * its try/catch (crashing the useState initializer in private mode) and to
 * coerce any non-'light' stored mode to 'dark' instead of honouring the
 * carrier fallback. These tests pin both fixes.
 */

function freshStorage(impl) {
  globalThis.localStorage = impl;
}

afterEach(() => {
  delete globalThis.localStorage;
});

const { readStoredAppearance, normalizeMode } = await import('../src/app/use-appearance.js');

test('corrupt payload falls back to the carrier default mode, not dark', () => {
  freshStorage({
    getItem: key => (key === 'concept_atlas_appearance' ? '{not json' : null),
  });
  assert.equal(readStoredAppearance('light').mode, 'light');
  assert.equal(readStoredAppearance('dark').mode, 'dark');
});

test('a valid legacy key still wins after the main payload corrupts', () => {
  freshStorage({
    getItem: key => {
      if (key === 'concept_atlas_appearance') return '{not json';
      if (key === 'concept_atlas_theme') return 'dark';
      return null;
    },
  });
  assert.equal(readStoredAppearance('light').mode, 'dark');
});

test('a stored payload with a garbage mode honours the fallback', () => {
  freshStorage({
    getItem: key => (key === 'concept_atlas_appearance' ? JSON.stringify({ mode: 'banana' }) : null),
  });
  assert.equal(readStoredAppearance('light').mode, 'light');
});

test('throwing localStorage does not crash the reader', () => {
  freshStorage({
    getItem() { throw new Error('access denied'); },
    setItem() { throw new Error('access denied'); },
  });
  const appearance = readStoredAppearance('light');
  assert.equal(appearance.mode, 'light');
  assert.equal(typeof appearance.skin, 'string');
  assert.equal(typeof appearance.style, 'string');
});

test('missing localStorage falls back to defaults instead of throwing', () => {
  // Node has no localStorage; the reader must degrade on ReferenceError too.
  const appearance = readStoredAppearance('light');
  assert.equal(appearance.mode, 'light');
});

test('normalizeMode only accepts dark/light and otherwise uses the fallback', () => {
  assert.equal(normalizeMode('dark', 'light'), 'dark');
  assert.equal(normalizeMode('light', 'dark'), 'light');
  assert.equal(normalizeMode('banana', 'light'), 'light');
  assert.equal(normalizeMode(undefined, 'dark'), 'dark');
});
