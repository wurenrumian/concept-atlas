import React from 'react';

const MAX_DEPTH = 6;
const MAX_LENGTH = 4000;

/**
 * Flatten whatever an MDX component renders — strings, React elements, arrays
 * and prop objects — into searchable plain text. Bounded in depth and length so
 * a pathological tree cannot stall the search box.
 */
export function collectText(value, depth = 0) {
  if (depth > MAX_DEPTH || value === null || value === undefined || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return value.map(item => collectText(item, depth + 1)).join(' ');
  }
  if (React.isValidElement(value)) {
    const props = value.props || {};
    const parts = [];
    for (const [key, prop] of Object.entries(props)) {
      // `components` is the MDX component registry, never content.
      if (key === 'children' || key === 'components') continue;
      if (typeof prop === 'string' || typeof prop === 'number') parts.push(String(prop));
      else if (prop && typeof prop === 'object') parts.push(collectText(prop, depth + 1));
    }
    parts.push(collectText(props.children, depth + 1));
    return parts.join(' ');
  }
  if (typeof value === 'object') {
    return Object.values(value).map(item => collectText(item, depth + 1)).join(' ');
  }
  return '';
}

/**
 * Build one lowercase haystack per node. Includes the semantic content fields
 * plus the free-form `customSections` (Evidence, FailureMode, Invariant,
 * Tradeoff, …) that previously fell outside the search index entirely.
 */
export function nodeSearchText(node) {
  if (!node) return '';
  const parts = [
    node.title,
    node.id,
    node.summary,
    node.overview,
    node.definition,
    node.mechanism,
    node.input,
    node.output,
    node.implementation,
    node.prerequisites,
    node.examples,
    node.counterexamples,
    node.boundaries,
    node.glossary,
    node.customSections,
  ];
  return parts.map(part => collectText(part)).join(' ').slice(0, MAX_LENGTH).toLowerCase();
}

/** Rank-free substring search returning at most `limit` nodes. */
export function searchNodes(nodes, query, limit = 8) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return [];
  const results = [];
  for (const node of nodes) {
    if (nodeSearchText(node).includes(needle)) results.push(node);
    if (results.length >= limit) break;
  }
  return results;
}
