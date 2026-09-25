/**
 * Figure numbering registry shared by <Figure> and <FigureRef>.
 *
 * Numbers are assigned per *scope*: a scroll document numbers its figures in
 * document order, while an atlas node numbers only the figures it shows. The
 * <FigureScope> context supplies that key, so browsing from one node to another
 * does not leak a running count between them. Registration is idempotent, so a
 * figure that re-renders (or remounts under React StrictMode) keeps its number.
 *
 * The store is module-level for the same reason as citations.js: a <FigureRef>
 * may appear before the <Figure> it points at, so the reference subscribes and
 * resolves once the target registers.
 */
const scopes = new Map();
let version = 0;
const listeners = new Set();

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

function scopeKey(scope) {
  return scope || 'document';
}

/** Registers `id` at the next free position in `scope` (no-op if already there). */
export function registerFigure(scope, id) {
  if (!id) return;
  const key = scopeKey(scope);
  const order = scopes.get(key) || [];
  if (order.includes(id)) return;
  order.push(id);
  scopes.set(key, order);
  emit();
}

/** Clears one scope, or every scope when called without arguments. */
export function resetFigures(scope) {
  if (scope === undefined) scopes.clear();
  else scopes.delete(scopeKey(scope));
  emit();
}

export function subscribeFigures(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFiguresVersion() {
  return version;
}

/** 1-based document position of `id` in `scope`, or null when unregistered. */
export function getFigureNumber(scope, id) {
  if (!id) return null;
  const order = scopes.get(scopeKey(scope));
  if (!order) return null;
  const index = order.indexOf(id);
  return index < 0 ? null : index + 1;
}
