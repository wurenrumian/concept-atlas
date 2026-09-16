let entries = [];
let version = 0;
const listeners = new Set();

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

/**
 * Citation registry shared by <References> and <Cite>.
 *
 * The store is intentionally module-level so numbering does not depend on
 * render order: <References> can appear above or below the cites that point at
 * it, and every <Cite> resolves to the reference's 1-based position.
 */
export function registerReferences(items) {
  entries = Array.isArray(items) ? items.filter(Boolean) : [];
  emit();
}

export function subscribeReferences(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReferencesVersion() {
  return version;
}

export function getReferenceIndex(id) {
  const index = entries.findIndex(entry => entry && entry.id === id);
  return index < 0 ? null : index + 1;
}

export function getReference(id) {
  return entries.find(entry => entry && entry.id === id) || null;
}
