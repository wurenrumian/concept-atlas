import React from 'react';
import { RELATION_TYPES, LEVEL_DEFS } from './relation-types.js';

/**
 * Creates an empty Concept Knowledge Graph structure
 */
export function createConceptGraphState() {
  return {
    meta: {
      id: '',
      title: '',
      summary: '',
      rootId: ''
    },
    nodes: new Map(), // id -> NodeObject
    relations: [], // Array<{ from, to, type, label, description }>
  };
}

/**
 * Normalizes raw node data extracted from MDX AST or React component tree
 */
export function normalizeNode(raw) {
  const id = raw.id || String(Math.random());
  return {
    id,
    title: raw.title || id,
    level: raw.level || 'L2',
    parent: raw.parent || null,
    children: Array.isArray(raw.children) ? raw.children : [],
    
    // Semantic Content Sections
    summary: raw.summary || '',
    overview: raw.overview || null,
    definition: raw.definition || null,
    mechanism: raw.mechanism || null,
    input: raw.input || null,
    output: raw.output || null,
    prerequisites: raw.prerequisites || [],
    implementation: raw.implementation || null, // { language, code } or React node
    examples: raw.examples || [],
    counterexamples: raw.counterexamples || [],
    boundaries: raw.boundaries || [],
    glossary: raw.glossary || [],
    customSections: raw.customSections || [],
  };
}

/**
 * Validates and indexes nodes and relations to build a graph model
 */
export function buildGraphModel(rawGraph) {
  const nodes = new Map();
  const diagnostics = [];
  const rawNodes = rawGraph.nodes || [];
  const rawRelations = rawGraph.relations || [];

  // Register all nodes
  rawNodes.forEach(n => {
    const node = normalizeNode(n);
    if (nodes.has(node.id)) diagnostics.push({ level: 'error', code: 'DUPLICATE_NODE_ID', nodeId: node.id });
    nodes.set(node.id, node);
  });

  // Build tree hierarchy: ensure parent <-> children consistency
  nodes.forEach(node => {
    if (node.parent && nodes.has(node.parent)) {
      const parentNode = nodes.get(node.parent);
      if (!parentNode.children.includes(node.id)) {
        parentNode.children.push(node.id);
      }
    }
  });

  // Explicit children references (from <ConceptRef />)
  nodes.forEach(node => {
    node.children.forEach(childId => {
      if (nodes.has(childId)) {
        const childNode = nodes.get(childId);
        if (!childNode.parent) {
          childNode.parent = node.id;
        }
      }
      else diagnostics.push({ level: 'warning', code: 'MISSING_CHILD', nodeId: node.id, targetId: childId });
    });
    if (node.parent && !nodes.has(node.parent)) diagnostics.push({ level: 'warning', code: 'ORPHAN_NODE', nodeId: node.id, targetId: node.parent });
    if (!LEVEL_DEFS[node.level]) diagnostics.push({ level: 'warning', code: 'UNKNOWN_LEVEL', nodeId: node.id, level: node.level });
  });

  // Filter valid relations
  const validRelations = [];
  rawRelations.forEach(rel => {
    if (nodes.has(rel.from) && nodes.has(rel.to)) {
      const typeDef = RELATION_TYPES[rel.type] || {
        label: rel.type,
        color: '#94a3b8',
        hasArrow: true
      };
      validRelations.push({
        ...rel,
        typeLabel: rel.label || typeDef.label,
        typeInfo: typeDef
      });
    }
  });

  // Determine root
  let rootId = rawGraph.meta?.rootId;
  if (!rootId || !nodes.has(rootId)) {
    // Find node with no parent or level L0
    for (const [id, node] of nodes.entries()) {
      if (!node.parent || node.level === 'L0') {
        rootId = id;
        break;
      }
    }
  }

  return {
    meta: {
      ...rawGraph.meta,
      rootId: rootId || (nodes.size > 0 ? Array.from(nodes.keys())[0] : null)
    },
    nodes,
    relations: validRelations,
    diagnostics
  };
}

/**
 * Helper to compute ancestor path from root to current node
 */
export function getAncestorPath(nodes, nodeId) {
  const path = [];
  let current = nodes.get(nodeId);
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    if (!current.parent) break;
    current = nodes.get(current.parent);
  }
  return path;
}

/**
 * Helper to get siblings of a node
 */
export function getSiblingNodes(nodes, nodeId) {
  const current = nodes.get(nodeId);
  if (!current || !current.parent) {
    // If root or has no parent, find other root nodes
    return Array.from(nodes.values()).filter(n => !n.parent && n.id !== nodeId);
  }
  const parent = nodes.get(current.parent);
  if (!parent) return [];
  return parent.children
    .filter(id => id !== nodeId && nodes.has(id))
    .map(id => nodes.get(id));
}

/**
 * Helper to get all incoming and outgoing relations for a node
 */
export function getNodeRelations(relations, nodeId) {
  const incoming = relations.filter(r => r.to === nodeId);
  const outgoing = relations.filter(r => r.from === nodeId);
  return { incoming, outgoing };
}
