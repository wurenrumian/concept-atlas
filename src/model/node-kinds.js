/**
 * Knowledge node kinds.
 *
 * `level` (L0–L4) answers "how deep in the zoom hierarchy is this node".
 * `kind` answers "what role does this node play in the explanation" — a
 * failure, a decision, a mechanism. The two axes are independent: an L2 node
 * can be a mechanism or a boundary. Kinds let the graph, the validator and the
 * inspector talk about knowledge type instead of only depth.
 *
 * The registry is the single source of truth: the validator checks against it,
 * the graph filters by it, and the UI reads labels/tones from it. `tone` must
 * resolve to a CSS variable defined in `tokens.css` for both themes.
 */
export const NODE_KINDS = {
  system: {
    label: '系统',
    description: '整体系统、产品或问题域的全貌',
    tone: 'var(--kind-system)',
  },
  stage: {
    label: '阶段',
    description: '生命周期阶段、处理步骤或子系统',
    tone: 'var(--kind-stage)',
  },
  mechanism: {
    label: '机制',
    description: '可解释、可验证的工作机制',
    tone: 'var(--kind-mechanism)',
  },
  artifact: {
    label: '产物',
    description: '阶段产出的实体、数据或文件',
    tone: 'var(--kind-artifact)',
  },
  failure: {
    label: '故障',
    description: '失败模式、异常与边界情况',
    tone: 'var(--kind-failure)',
  },
  tool: {
    label: '工具',
    description: '使用的工具、库或外部依赖',
    tone: 'var(--kind-tool)',
  },
  boundary: {
    label: '边界',
    description: '约束、前提、限制与非目标',
    tone: 'var(--kind-boundary)',
  },
  decision: {
    label: '决策',
    description: '设计取舍与选择点',
    tone: 'var(--kind-decision)',
  },
};

export const NODE_KIND_NAMES = Object.keys(NODE_KINDS);
export const NODE_KIND_SET = new Set(NODE_KIND_NAMES);

/** Coerce an arbitrary value to a registered kind id, or null. */
export function normalizeKind(value) {
  return typeof value === 'string' && NODE_KIND_SET.has(value) ? value : null;
}

/** Registry entry for a kind id, or null when unset/unknown. */
export function kindInfo(kind) {
  return kind ? NODE_KINDS[kind] || null : null;
}
