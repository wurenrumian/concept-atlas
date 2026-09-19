/**
 * Pure browsing-history helpers for the atlas carrier.
 *
 * History is a single `{ entries, index }` value instead of two separate
 * `useState` calls. Keeping them together removes the side effect that used to
 * live inside the `setHistory` updater (which React StrictMode can double
 * invoke) and makes the whole navigation model trivially unit-testable.
 */

/**
 * Push a node onto the history, truncating any forward entries.
 * Returns the same object when `nodeId` is already the current entry so React
 * can bail out of the state update.
 */
export function pushNode(state, nodeId) {
  const base = state.entries.slice(0, state.index + 1);
  if (base[base.length - 1] === nodeId) return state;
  const entries = [...base, nodeId];
  return { entries, index: entries.length - 1 };
}

/**
 * Move one step through the history. Returns `null` when the move would leave
 * the bounds, so the caller can avoid a redundant re-render.
 */
export function stepHistory(state, direction) {
  const nextIndex = Math.max(0, Math.min(state.entries.length - 1, state.index + direction));
  if (nextIndex === state.index) return null;
  return { entries: state.entries, index: nextIndex };
}

/**
 * Resolve a node id arriving from a `popstate` event (browser back/forward).
 * Reuses an existing entry when present so the back stack stays consistent.
 */
export function syncFromLocation(state, nodeId) {
  const existing = state.entries.lastIndexOf(nodeId);
  if (existing >= 0) return { entries: state.entries, index: existing };
  const entries = [...state.entries, nodeId];
  return { entries, index: entries.length - 1 };
}
