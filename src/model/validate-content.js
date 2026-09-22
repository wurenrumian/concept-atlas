import { RELATION_TYPES, LEVEL_DEFS } from './relation-types.js';
import { NODE_KIND_NAMES, NODE_KIND_SET } from './node-kinds.js';

/**
 * Single source of truth for the semantic component registry.
 *
 * `normalize-content.js` uses this to decide which elements are semantic leaves
 * (as opposed to MDX wrapper components), and the CLI validator uses it to flag
 * unknown component names. Keeping one list prevents the two from drifting.
 */
export const KNOWN_COMPONENTS = [
  // Page shells
  'ExplainPage',
  'ConceptGraph',
  'ConceptNode',
  'ConceptRef',
  'Children',
  'Relation',
  'ScrollDocument',
  'ScrollHeader',
  'ScrollSection',
  'ScrollProse',
  'ScrollPair',
  'ScrollGrid',
  // Node content semantics
  'Overview',
  'Definition',
  'Mechanism',
  'Implementation',
  'CodeBlock',
  'Boundary',
  'Example',
  'Counterexample',
  'Prerequisite',
  'Input',
  'Output',
  'Glossary',
  // Argument and evidence
  'Evidence',
  'Invariant',
  'FailureMode',
  'Tradeoff',
  'LearningObjectives',
  'KeyQuestion',
  'WorkedExample',
  'Step',
  'Quiz',
  'KeyTakeaways',
  // Provenance and inline aids
  'Source',
  'Confidence',
  'Term',
  // Data and behaviour models
  'DataTable',
  'StateMachine',
  'DecisionTree',
  'FeedbackLoop',
  'Metric',
  'CodeDiff',
  // Information models
  'Compare',
  'DecisionMatrix',
  'Flow',
  'Timeline',
  'FrameworkModel',
  'MatrixModel',
  'FormulaModel',
  'PyramidModel',
  'FunnelModel',
  // Reading and layout
  'Insight',
  'Callout',
  'Details',
  'NoteGrid',
  'Tabs',
  'Columns',
  'Stack',
  'Grid',
  'Split',
  'ScrollToc',
  // Graphics and extension blocks
  'Mermaid',
  'RelationMap',
  'RelationPath',
  'Math',
  'MathBlock',
  'Chart',
  'Figure',
  'Image',
  'Cite',
  'References',
];

export const KNOWN_COMPONENT_SET = new Set(KNOWN_COMPONENTS);

export const RELATION_TYPE_NAMES = Object.keys(RELATION_TYPES).filter(
  name => !RELATION_TYPES[name].isTree,
);
export const RELATION_TYPE_SET = new Set(RELATION_TYPE_NAMES);

export const LEVEL_NAMES = Object.keys(LEVEL_DEFS);
export const LEVEL_SET = new Set(LEVEL_NAMES);

/** Props that must be arrays, mapped to the component that owns them. */
export const ARRAY_PROPS = {
  Flow: ['steps'],
  Timeline: ['events'],
  FrameworkModel: ['elements'],
  MatrixModel: ['cells'],
  FormulaModel: ['variables'],
  PyramidModel: ['levels'],
  FunnelModel: ['steps'],
  DecisionMatrix: ['headers', 'rows'],
  Compare: ['items'],
  NoteGrid: ['notes'],
  Tabs: ['items'],
  LearningObjectives: ['items'],
  Tradeoff: ['options'],
  RelationMap: ['items'],
  RelationPath: ['steps'],
  References: ['items'],
  Chart: ['data', 'series'],
  DataTable: ['headers', 'rows'],
  StateMachine: ['states', 'transitions'],
  KeyTakeaways: ['items'],
  DecisionTree: ['branches'],
  FeedbackLoop: ['nodes'],
};

/** Node content components that satisfy the "has substance" contract. */
const CORE_CONTENT_COMPONENTS = new Set([
  'Definition',
  'Mechanism',
  'Implementation',
  'CodeBlock',
  'Boundary',
  'Example',
  'Counterexample',
  'Evidence',
  'Invariant',
  'FailureMode',
  'Tradeoff',
  'Input',
  'Output',
  'Glossary',
  'WorkedExample',
  'DataTable',
  'StateMachine',
  'Quiz',
  'KeyTakeaways',
  'Metric',
  'CodeDiff',
  'DecisionTree',
  'FeedbackLoop',
  'Flow',
  'Timeline',
  'DecisionMatrix',
  'Compare',
  'FrameworkModel',
  'MatrixModel',
  'FormulaModel',
  'PyramidModel',
  'FunnelModel',
  'Mermaid',
  'RelationMap',
  'RelationPath',
  'Math',
  'MathBlock',
  'Chart',
  'Figure',
]);

function maskIgnored(source) {
  const mask = text => text.replace(/[^\n]/g, ' ');
  let out = source;
  // Fenced code blocks (``` ... ```) may contain MDX-looking samples; hide them
  // while preserving offsets so reported line numbers stay accurate.
  out = out.replace(/^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*$/gm, mask);
  out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, mask);
  // Inline code spans may also contain sample tags. Skip a backtick that opens
  // a JS template literal inside a JSX expression (`={...}`), which is where
  // multi-line chart strings live.
  out = out.replace(/([^{])`[^`\n]*`/g, match => match[0] + mask(match.slice(1)));
  return out;
}

function computeLineStarts(source) {
  const starts = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function locate(offset, lineStarts) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (lineStarts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return { line: low + 1, column: offset - lineStarts[low] + 1 };
}

function skipString(source, index) {
  const quote = source[index];
  let i = index + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    i += 1;
  }
  return -1;
}

function findMatchingBrace(source, open) {
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(source, i);
      if (i < 0) return -1;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      const nl = source.indexOf('\n', i);
      i = nl < 0 ? source.length : nl;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

function parseTag(source, start) {
  let i = start + 1;
  const closing = source[i] === '/';
  if (closing) i += 1;
  const nameMatch = /^[A-Za-z][\w.:-]*/.exec(source.slice(i));
  if (!nameMatch) return null;
  const name = nameMatch[0];
  i += name.length;

  if (closing) {
    const gt = source.indexOf('>', i);
    return gt < 0 ? null : { kind: 'close', name, attrs: [], start, end: gt + 1 };
  }

  const attrs = [];
  while (i < source.length) {
    while (i < source.length && /\s/.test(source[i])) i += 1;
    if (source[i] === '>') return { kind: 'open', name, attrs, start, end: i + 1 };
    if (source[i] === '/' && source[i + 1] === '>') return { kind: 'self', name, attrs, start, end: i + 2 };
    const attrMatch = /^[A-Za-z_][\w:.-]*/.exec(source.slice(i));
    if (!attrMatch) {
      i += 1;
      continue;
    }
    const attrName = attrMatch[0];
    i += attrName.length;
    while (i < source.length && /\s/.test(source[i])) i += 1;
    const attr = { name: attrName, value: null, expr: null, quoted: false, hasValue: false };
    if (source[i] === '=') {
      i += 1;
      while (i < source.length && /\s/.test(source[i])) i += 1;
      const ch = source[i];
      if (ch === '"' || ch === "'") {
        const close = source.indexOf(ch, i + 1);
        if (close < 0) return null;
        attr.value = source.slice(i + 1, close);
        attr.quoted = true;
        i = close + 1;
      } else if (ch === '{') {
        const close = findMatchingBrace(source, i);
        if (close < 0) return null;
        attr.expr = source.slice(i + 1, close);
        attr.value = attr.expr;
        i = close + 1;
      } else {
        let j = i;
        while (j < source.length && !/[\s>]/.test(source[j])) j += 1;
        attr.value = source.slice(i, j);
        i = j;
      }
      attr.hasValue = true;
    }
    attrs.push(attr);
  }
  return null;
}

function tokenize(source) {
  const tags = [];
  let i = 0;
  while (i < source.length) {
    const lt = source.indexOf('<', i);
    if (lt < 0) break;
    const next = source[lt + 1];
    if (next === '/' || /[A-Za-z]/.test(next || '')) {
      const parsed = parseTag(source, lt);
      if (parsed) {
        tags.push(parsed);
        i = parsed.end;
        continue;
      }
    }
    i = lt + 1;
  }
  return tags;
}

/** Blank out tag ranges, preserving offsets and newlines, so only text remains. */
function textRegions(source, tags) {
  const ranges = tags
    .map(tag => [tag.start, tag.end])
    .sort((a, b) => a[0] - b[0]);
  const pieces = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start < cursor) continue;
    pieces.push(source.slice(cursor, start));
    pieces.push(source.slice(start, end).replace(/[^\n]/g, ' '));
    cursor = end;
  }
  pieces.push(source.slice(cursor));
  return pieces.join('');
}

function attrsToMap(attrs) {
  const map = {};
  for (const attr of attrs) map[attr.name] = attr;
  return map;
}

function attrValue(map, name) {
  const attr = map[name];
  if (!attr || !attr.hasValue) return null;
  return attr.value;
}

/**
 * Statically validate a Concept Atlas MDX document without rendering React.
 * Works in Node (CLI) and in the browser (registry only).
 *
 * @param {string} source MDX source text
 * @param {object} [options]
 * @param {string|null} [options.filePath] Absolute path, used for asset checks
 * @param {'atlas'|'scroll'|null} [options.mode] Expected carrier
 * @param {boolean} [options.strict] Promote structural warnings to errors
 * @param {(file:string)=>boolean} [options.assetExists] Asset existence probe
 * @returns {{diagnostics:object[], stats:object, carrier:string|null}}
 */
export function validateMdxSource(source, options = {}) {
  const { filePath = null, mode = null, strict = false, assetExists = null } = options;
  const lineStarts = computeLineStarts(source);
  const masked = maskIgnored(source);
  const tags = tokenize(masked);
  const diagnostics = [];
  const add = (severity, code, message, offset, target) => {
    const at = locate(offset, lineStarts);
    diagnostics.push({ severity, code, message, line: at.line, column: at.column, target: target || null });
  };

  const nodes = [];
  const nodesById = new Map();
  const graphRoots = [];
  const relations = [];
  const refs = [];
  const usedComponents = new Map();
  const stack = [];

  const currentConceptNode = () => {
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      if (stack[i].conceptNode) return stack[i].conceptNode;
    }
    return null;
  };

  for (const tag of tags) {
    if (tag.kind === 'open' || tag.kind === 'self') {
      if (!usedComponents.has(tag.name)) usedComponents.set(tag.name, tag.start);
    }
    if (tag.name === 'ConceptGraph' && tag.kind !== 'close') graphRoots.push({ tag, root: attrValue(attrsToMap(tag.attrs), 'root') });

    if (tag.name === 'ConceptNode' && tag.kind !== 'close') {
      const map = attrsToMap(tag.attrs);
      const node = {
        id: attrValue(map, 'id'),
        title: attrValue(map, 'title'),
        level: attrValue(map, 'level') || 'L2',
        kind: attrValue(map, 'kind'),
        parent: attrValue(map, 'parent'),
        summary: attrValue(map, 'summary'),
        offset: tag.start,
        closeOffset: null,
        body: '',
        map,
      };
      nodes.push(node);
      if (tag.kind === 'open') stack.push({ tag, conceptNode: node });
      continue;
    }

    if (tag.kind === 'open') {
      stack.push({ tag, conceptNode: null });
    }

    if (tag.name === 'ConceptRef' && tag.kind !== 'close') {
      refs.push({ id: attrValue(attrsToMap(tag.attrs), 'id'), offset: tag.start, node: currentConceptNode() });
    }

    if (tag.name === 'Relation' && tag.kind !== 'close') {
      const map = attrsToMap(tag.attrs);
      relations.push({
        from: attrValue(map, 'from'),
        to: attrValue(map, 'to'),
        type: attrValue(map, 'type') || 'depends-on',
        label: attrValue(map, 'label'),
        offset: tag.start,
      });
    }

    if (tag.name === 'Figure' || tag.name === 'Image') {
      const map = attrsToMap(tag.attrs);
      const src = attrValue(map, 'src');
      const quoted = map.src ? map.src.quoted : false;
      if (!src) add('warning', 'FIGURE_MISSING_SRC', 'Figure 缺少 src', tag.start, tag.name);
      else if (quoted && !/^(https?:|data:|\/)/i.test(src) && filePath && assetExists) {
        const resolved = src.startsWith('.') ? src : `./${src}`;
        if (!assetExists(resolved)) {
          add('warning', 'ASSET_MISSING', `找不到图片文件：${src}（将显示占位符）`, tag.start, src);
        }
      }
    }

    if (tag.kind === 'close') {
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        if (stack[i].tag.name === tag.name) {
          const [entry] = stack.splice(i, 1);
          if (entry.conceptNode) {
            entry.conceptNode.closeOffset = tag.start;
            entry.conceptNode.body = source.slice(entry.tag.end, tag.start);
          }
          break;
        }
      }
    }
  }

  // Unknown component names catch typos before they crash the browser.
  for (const [name, offset] of usedComponents) {
    if (!/^[A-Z]/.test(name)) continue;
    if (!KNOWN_COMPONENT_SET.has(name)) {
      add('error', 'UNKNOWN_COMPONENT', `未知组件 <${name}>，名称可能拼错或未导出`, offset, name);
    }
  }

  // `{` inside <Math> children is parsed by MDX as an expression, not LaTeX.
  for (const match of masked.matchAll(/<Math(?![^>]*\/>)[^>]*>([\s\S]*?)<\/Math>/g)) {
    if (match[1].includes('{')) {
      add('warning', 'MATH_CHILDREN_BRACES', 'Math 子内容包含 {，MDX 会当作表达式；请改用 formula="..."', match.index, 'Math');
    }
  }

  // MDX evaluates `{ ... }` in prose as a JavaScript expression. Authors often
  // write data shapes like `{label, value}` in a sentence, which crashes the
  // page with "label is not defined".
  const text = textRegions(masked, tags);
  for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
    const expression = match[1].trim();
    if (!expression || expression.startsWith('/*')) continue;
    if (/^[A-Za-z_$][\w$]*\s*(,[\s\S]*)?$/.test(expression)) {
      add('warning', 'PROSE_EXPRESSION', `正文中的 {${expression}} 会被 MDX 当作表达式并导致运行时报错；请改成行内代码 \`{${expression}}\``, match.index, expression);
    }
  }

  // MDX has no frontmatter support by default: a leading `---` block renders as
  // a stray rule and text at the top of the page.
  if (/^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/.test(source)) {
    add('warning', 'FRONTMATTER_UNSUPPORTED', '文件以 --- 开头，但 MDX 不解析 frontmatter，它会被渲染成正文；请删除', 0, null);
  }

  const carrier = usedComponents.has('ScrollDocument') ? 'scroll'
    : (usedComponents.has('ExplainPage') || usedComponents.has('ConceptGraph')) ? 'atlas'
      : null;

  if (!carrier) {
    add('error', 'CARRIER_MISSING', '找不到页面外壳：需要 ExplainPage/ConceptGraph 或 ScrollDocument', 0, null);
  }
  if (usedComponents.has('ScrollDocument') && (usedComponents.has('ExplainPage') || usedComponents.has('ConceptGraph'))) {
    add('error', 'CARRIER_CONFLICT', '同一文件同时包含 atlas 和 scroll 外壳，只能选择其一', usedComponents.get('ScrollDocument'), null);
  }
  if (mode && carrier && mode !== carrier) {
    add('error', 'CARRIER_MODE_MISMATCH', `指定 --mode ${mode}，但文件是 ${carrier} 载体`, 0, carrier);
  }

  for (const node of nodes) {
    if (!node.id) {
      add('error', 'NODE_MISSING_ID', 'ConceptNode 缺少 id', node.offset, null);
      continue;
    }
    if (nodesById.has(node.id)) {
      add('error', 'DUPLICATE_NODE_ID', `重复的节点 id：${node.id}`, node.offset, node.id);
    } else {
      nodesById.set(node.id, node);
    }
  }

  for (const node of nodes) {
    const label = node.id || '<无 id>';
    if (!node.title) add('error', 'NODE_MISSING_TITLE', `节点 ${label} 缺少 title`, node.offset, node.id);
    if (!node.summary) add('warning', 'NODE_MISSING_SUMMARY', `节点 ${label} 缺少 summary`, node.offset, node.id);
    if (!LEVEL_SET.has(node.level)) {
      add('warning', 'UNKNOWN_LEVEL', `节点 ${label} 的 level 无效：${node.level}`, node.offset, node.id);
    }
    if (node.kind && !NODE_KIND_SET.has(node.kind)) {
      add('warning', 'UNKNOWN_KIND', `节点 ${label} 的 kind 无效：${node.kind}（可选：${NODE_KIND_NAMES.join('、')}）`, node.offset, node.id);
    }
    if (node.parent && !nodesById.has(node.parent)) {
      add('error', 'MISSING_PARENT', `节点 ${label} 的 parent 不存在：${node.parent}`, node.offset, node.id);
    }
    if (node.body && ![...CORE_CONTENT_COMPONENTS].some(name => new RegExp(`<${name}\\b`).test(node.body))) {
      add('warning', 'NODE_NO_CORE_CONTENT', `节点 ${label} 缺少核心内容组件（Definition/Mechanism/Example/Boundary 等）`, node.offset, node.id);
    }
    // Opt-in knowledge-kind contracts. They only fire once an author declares
    // `kind`, so the existing corpus keeps validating clean.
    if (node.kind === 'mechanism' && node.body && !/<(Invariant|Evidence)\b/.test(node.body)) {
      add(strict ? 'error' : 'warning', 'MECHANISM_KIND_UNVERIFIED', `机制节点 ${label} 建议至少包含一个 <Invariant> 或 <Evidence>`, node.offset, node.id);
    }
    if (node.kind === 'failure' && node.body && !/<FailureMode\b/.test(node.body)) {
      add(strict ? 'error' : 'warning', 'FAILURE_KIND_UNSTRUCTURED', `故障节点 ${label} 建议使用 <FailureMode> 描述现象、原因、证据与建议`, node.offset, node.id);
    }
  }

  const l0 = nodes.filter(node => node.level === 'L0');
  if (nodes.length > 0 && l0.length === 0) {
    const severity = strict ? 'error' : 'warning';
    add(severity, 'NO_ROOT_LEVEL', '没有 L0 根节点，页面将从第一个无父节点开始', nodes[0].offset, null);
  }
  if (l0.length > 1) {
    add(strict ? 'error' : 'warning', 'MULTIPLE_ROOT_LEVEL', `存在 ${l0.length} 个 L0 节点，建议只保留一个`, l0[1].offset, l0[1].id);
  }

  for (const graph of graphRoots) {
    if (!graph.root) {
      add('warning', 'GRAPH_MISSING_ROOT', 'ConceptGraph 缺少 root，将自动推断根节点', graph.tag.start, null);
    } else if (!nodesById.has(graph.root)) {
      add('error', 'GRAPH_ROOT_UNRESOLVED', `ConceptGraph root 指向不存在的节点：${graph.root}`, graph.tag.start, graph.root);
    }
  }

  for (const ref of refs) {
    if (!ref.id) add('error', 'REF_MISSING_ID', 'ConceptRef 缺少 id', ref.offset, null);
    else if (!nodesById.has(ref.id)) {
      add('error', 'REF_UNRESOLVED', `ConceptRef 指向不存在的节点：${ref.id}`, ref.offset, ref.id);
    }
    if (ref.node && ref.node.id && ref.node.id === ref.id) {
      add('warning', 'REF_SELF', `节点 ${ref.node.id} 引用了自身`, ref.offset, ref.id);
    }
  }

  for (const relation of relations) {
    if (!relation.from || !nodesById.has(relation.from)) {
      add('error', 'RELATION_FROM_UNRESOLVED', `Relation from 不存在：${relation.from || '<空>'}`, relation.offset, relation.from);
    }
    if (!relation.to || !nodesById.has(relation.to)) {
      add('error', 'RELATION_TO_UNRESOLVED', `Relation to 不存在：${relation.to || '<空>'}`, relation.offset, relation.to);
    }
    if (!RELATION_TYPE_SET.has(relation.type)) {
      add('warning', 'UNKNOWN_RELATION_TYPE', `未知关系类型：${relation.type}`, relation.offset, relation.type);
    }
    if (!relation.label) {
      add('warning', 'RELATION_MISSING_LABEL', `关系 ${relation.from || '?'} → ${relation.to || '?'} 缺少 label`, relation.offset, null);
    }
    if (relation.from && relation.to && relation.from === relation.to) {
      add('warning', 'RELATION_SELF', `关系 ${relation.from} 指向自身`, relation.offset, relation.from);
    }
  }

  // RelationMap items carry their own `type`; check them against the same
  // whitelist as <Relation type> so example maps can't invent types silently.
  for (const tag of tags) {
    if (tag.name !== 'RelationMap' || tag.kind === 'close') continue;
    const map = attrsToMap(tag.attrs);
    const items = map.items;
    if (!items || !items.hasValue || items.quoted || !items.expr) continue;
    for (const match of items.expr.matchAll(/\btype\s*:\s*(['"])([^'"]+)\1/g)) {
      if (!RELATION_TYPE_SET.has(match[2])) {
        add('warning', 'UNKNOWN_RELATION_TYPE', `RelationMap 含未知关系类型：${match[2]}（可选：${RELATION_TYPE_NAMES.join('、')}）`, tag.start, match[2]);
      }
    }
  }

  // A self-closing <FailureMode /> with no fields carries no information; an
  // open tag with children is left to the author.
  for (const tag of tags) {
    if (tag.name !== 'FailureMode' || tag.kind !== 'self') continue;
    const map = attrsToMap(tag.attrs);
    const hasField = ['symptom', 'cause', 'evidence', 'remedy'].some(field => attrValue(map, field));
    if (!hasField) {
      add('warning', 'FAILURE_MODE_EMPTY', 'FailureMode 缺少 symptom/cause/evidence/remedy，也没有子内容', tag.start, 'FailureMode');
    }
  }

  // Array-prop sanity: catches `steps="foo"` and `steps={obj}` early.
  for (const tag of tags) {
    const props = ARRAY_PROPS[tag.name];
    if (!props || tag.kind === 'close') continue;
    const map = attrsToMap(tag.attrs);
    for (const prop of props) {
      const attr = map[prop];
      if (!attr || !attr.hasValue) continue;
      if (attr.quoted) {
        add('warning', 'PROP_EXPECTS_ARRAY', `${tag.name} 的 ${prop} 应为数组，却收到字符串`, tag.start, `${tag.name}.${prop}`);
      } else if (attr.expr && !attr.expr.trim().startsWith('[')) {
        add('warning', 'PROP_EXPECTS_ARRAY', `${tag.name} 的 ${prop} 应为数组字面量 [...]`, tag.start, `${tag.name}.${prop}`);
      }
    }
  }

  return {
    carrier,
    stats: {
      nodes: nodes.length,
      relations: relations.length,
      refs: refs.length,
      components: usedComponents.size,
    },
    diagnostics,
  };
}

export function countBySeverity(diagnostics) {
  return diagnostics.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, { error: 0, warning: 0 });
}

/**
 * Optional renderers a document actually instantiates.
 *
 * Mermaid and KaTeX (plus the ~1.4 MB of woff2 fonts its stylesheet inlines) are
 * heavy enough that bundling them into a page which never renders a diagram or a
 * formula dominates both build time and output size. The build reads these flags
 * and swaps unused renderers for stubs.
 *
 * Detection runs on the masked source, so `<Math>` inside a fenced block or an
 * inline code span does not count as usage.
 */
export function detectFeatures(source) {
  const used = new Set();
  for (const tag of tokenize(maskIgnored(source))) {
    if (tag.kind !== 'close') used.add(tag.name);
  }
  return {
    math: used.has('Math') || used.has('MathBlock'),
    mermaid: used.has('Mermaid'),
  };
}

/** JSX string literals decode these five entities; a single pass avoids
 * double-decoding sequences like `&amp;lt;`. */
const ENTITY_MAP = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
const decodeEntities = text => text.replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ENTITY_MAP[entity]);

/**
 * Reads the browser-tab title from the MDX source without rendering: the atlas
 * shell declares it on <ExplainPage title="...">, the scroll shell on
 * <ScrollHeader title="...">. Only quoted string props count — a `{...}`
 * expression title cannot be known at build time. Returns null when no static
 * title exists, so the build keeps the carrier's default <title>.
 */
export function extractPageTitle(source) {
  const tags = tokenize(maskIgnored(source));
  for (const shell of ['ExplainPage', 'ScrollHeader']) {
    const tag = tags.find(item => item.name === shell && item.kind !== 'close');
    if (!tag) continue;
    const attr = attrsToMap(tag.attrs).title;
    if (attr && attr.hasValue && attr.quoted && attr.value.trim()) {
      return decodeEntities(attr.value).trim();
    }
  }
  return null;
}
