import test from 'node:test';
import assert from 'node:assert/strict';
import { pushNode, stepHistory, syncFromLocation } from '../src/app/navigation.js';

test('pushNode appends a new entry and moves the index', () => {
  const next = pushNode({ entries: ['a'], index: 0 }, 'b');
  assert.deepEqual(next, { entries: ['a', 'b'], index: 1 });
});

test('pushNode is a no-op when the node is already current', () => {
  const state = { entries: ['a', 'b'], index: 1 };
  assert.equal(pushNode(state, 'b'), state);
});

test('pushNode truncates forward history after going back', () => {
  const next = pushNode({ entries: ['a', 'b', 'c'], index: 1 }, 'd');
  assert.deepEqual(next, { entries: ['a', 'b', 'd'], index: 2 });
});

test('stepHistory walks back and forward within bounds', () => {
  const state = { entries: ['a', 'b', 'c'], index: 2 };
  const back = stepHistory(state, -1);
  assert.deepEqual(back, { entries: ['a', 'b', 'c'], index: 1 });
  assert.deepEqual(stepHistory(back, 1), { entries: ['a', 'b', 'c'], index: 2 });
});

test('stepHistory returns null at the bounds instead of re-rendering', () => {
  assert.equal(stepHistory({ entries: ['a'], index: 0 }, -1), null);
  assert.equal(stepHistory({ entries: ['a'], index: 0 }, 1), null);
});

test('syncFromLocation reuses an existing entry or appends', () => {
  assert.deepEqual(
    syncFromLocation({ entries: ['a', 'b'], index: 1 }, 'a'),
    { entries: ['a', 'b'], index: 0 },
  );
  assert.deepEqual(
    syncFromLocation({ entries: ['a'], index: 0 }, 'z'),
    { entries: ['a', 'z'], index: 1 },
  );
});

test('the Alt+arrow history shortcut is reachable (guard regression)', async () => {
  // The keyboard guard must not return before the altKey branch. This mirrors
  // the ordering the App effect uses; if the guard is restored, this fails.
  const source = await import('node:fs/promises').then(fs =>
    fs.readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8'));
  const altBranch = source.indexOf("e.altKey && e.key === 'ArrowLeft'");
  const modifierGuard = source.indexOf('if (e.metaKey || e.ctrlKey || e.altKey || typing) return;');
  assert.ok(altBranch > 0, 'expected an Alt+ArrowLeft branch');
  assert.ok(modifierGuard > altBranch, 'the modifier guard must come after the Alt+arrow branch');
});
