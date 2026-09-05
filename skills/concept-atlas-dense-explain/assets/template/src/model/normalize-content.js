import React, { Children, isValidElement } from 'react';

/**
 * Extracts structured node and relation data from MDX / React component elements
 */
export function extractConceptData(explainPageElement) {
  // MDX exports a component rather than an already-expanded element.
  // Resolve that wrapper before reading page metadata or its children.
  explainPageElement = unwrapComponent(explainPageElement);

  const result = {
    meta: {
      id: explainPageElement.props.id || 'explain-page',
      title: explainPageElement.props.title || '',
      summary: explainPageElement.props.summary || '',
      rootId: null,
      layout: explainPageElement.props.layout || 'editorial',
      density: explainPageElement.props.density || 'reading',
    },
    nodes: [],
    relations: []
  };

  function traverse(child) {
    if (!child || !isValidElement(child)) return;

    const componentName = getComponentName(child);

    // MDX compiles to a component function. The element passed from main.jsx
    // has no children until that function is evaluated, so unwrap non-semantic
    // component wrappers before walking the semantic tree.
    if (typeof child.type === 'function' && !isSemanticComponent(componentName)) {
      traverse(child.type(child.props));
      return;
    }

    if (componentName === 'ConceptGraph') {
      if (child.props.root) {
        result.meta.rootId = child.props.root;
      }
      Children.forEach(child.props.children, traverse);
      return;
    }

    if (componentName === 'ConceptNode') {
      const nodeData = parseConceptNode(child);
      result.nodes.push(nodeData);
      return;
    }

    if (componentName === 'Relation') {
      result.relations.push({
        from: child.props.from,
        to: child.props.to,
        type: child.props.type || 'depends-on',
        label: child.props.label,
        description: child.props.description || child.props.children || ''
      });
      return;
    }

    if (child.props && child.props.children) {
      Children.forEach(child.props.children, traverse);
    }
  }

  if (explainPageElement.props && explainPageElement.props.children) {
    Children.forEach(explainPageElement.props.children, traverse);
  }

  return result;
}

function unwrapComponent(element) {
  let current = element;
  while (
    current &&
    isValidElement(current) &&
    typeof current.type === 'function' &&
    !isSemanticComponent(getComponentName(current))
  ) {
    current = current.type(current.props);
  }
  return current;
}

const SEMANTIC_COMPONENTS = new Set([
  'ExplainPage',
  'ConceptGraph',
  'ConceptNode',
  'ConceptRef',
  'Children',
  'Relation',
  'Overview',
  'Definition',
  'Mechanism',
  'Input',
  'Output',
  'Prerequisite',
  'Implementation',
  'Example',
  'Counterexample',
  'Boundary',
  'Glossary',
  'Mermaid',
  'RelationMap',
  'Insight',
  'NoteGrid',
  'Stack',
  'Grid',
  'Split',
  'Tabs',
  'RelationPath',
  'LearningObjectives',
  'KeyQuestion',
  'Evidence',
  'Invariant',
  'FailureMode',
  'Tradeoff',
]);

function isSemanticComponent(name) {
  return SEMANTIC_COMPONENTS.has(name);
}

function getComponentName(element) {
  if (!element || !element.type) return '';
  if (typeof element.type === 'string') return element.type;
  return element.type.displayName || element.type.name || '';
}

function parseConceptNode(nodeElement) {
  const props = nodeElement.props;
  const node = {
    id: props.id,
    title: props.title || props.id,
    level: props.level || 'L2',
    parent: props.parent !== undefined ? props.parent : null,
    children: [],
    summary: props.summary || '',
    overview: null,
    definition: null,
    mechanism: null,
    input: props.input || null,
    output: props.output || null,
    prerequisites: [],
    implementation: null,
    examples: [],
    counterexamples: [],
    boundaries: [],
    glossary: [],
    customSections: []
  };

  Children.forEach(props.children, child => {
    if (!child || !isValidElement(child)) return;
    const name = getComponentName(child);

    switch (name) {
      case 'Overview':
        node.overview = child.props.children;
        if (!node.summary && typeof child.props.children === 'string') {
          node.summary = child.props.children.trim();
        }
        break;
      case 'Definition':
        node.definition = child.props.children;
        break;
      case 'Mechanism':
        node.mechanism = child.props.children;
        break;
      case 'Input':
        node.input = child.props.children;
        break;
      case 'Output':
        node.output = child.props.children;
        break;
      case 'Prerequisite':
        if (typeof child.props.children === 'string') {
          node.prerequisites.push(child.props.children);
        } else if (Array.isArray(child.props.children)) {
          node.prerequisites.push(...child.props.children);
        } else {
          node.prerequisites.push(child.props.children);
        }
        break;
      case 'Implementation':
        node.implementation = {
          language: child.props.language || 'text',
          title: child.props.title || '代码实现',
          code: child.props.children
        };
        break;
      case 'Example':
        node.examples.push({
          title: child.props.title || '典型示例',
          content: child.props.children
        });
        break;
      case 'Counterexample':
        node.counterexamples.push({
          title: child.props.title || '边界反例 / 常见误区',
          content: child.props.children
        });
        break;
      case 'Boundary':
        node.boundaries.push({
          title: child.props.title || '边界条件 / 约束',
          content: child.props.children
        });
        break;
      case 'Glossary':
        node.glossary.push({
          term: child.props.term,
          definition: child.props.children
        });
        break;
      case 'Children':
        Children.forEach(child.props.children, ref => {
          if (isValidElement(ref) && (getComponentName(ref) === 'ConceptRef' || ref.props.id)) {
            node.children.push(ref.props.id);
          }
        });
        break;
      case 'ConceptRef':
        if (child.props.id) {
          node.children.push(child.props.id);
        }
        break;
      default:
        // Semantic presentation components inside node
        node.customSections.push(child);
        break;
    }
  });

  return node;
}
