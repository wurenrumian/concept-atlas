# Component contract

## Structure

```mdx
<ExplainPage id="topic" title="..." summary="...">
  <ConceptGraph root="root">
    <ConceptNode id="root" title="..." level="L0" summary="...">
      <Definition>...</Definition>
      <Input>...</Input><Output>...</Output>
      <Children><ConceptRef id="child" /></Children>
    </ConceptNode>
    <ConceptNode id="child" title="..." level="L1" parent="root">...</ConceptNode>
    <Relation from="child" to="other" type="depends-on" label="依赖" />
  </ConceptGraph>
</ExplainPage>
```

Supported semantic content includes `Overview`, `Definition`, `Mechanism`, `Implementation`, `Example`, `Counterexample`, `Boundary`, `Prerequisite`, `Input`, `Output`, and `Glossary`.

High-value verification components: `LearningObjectives`, `KeyQuestion`, `Evidence(command, observes)`, `Invariant(title)`, `FailureMode(symptom, cause, evidence, remedy)`, and `Tradeoff(options)`.

Presentation components: `Stack`, `Grid`, `Split`, `Tabs`, `Flow`, `Compare`, `DecisionMatrix`, `Timeline`, `FrameworkModel`, `MatrixModel`, `FormulaModel`, `PyramidModel`, `FunnelModel`, `Callout`, `Details`, `RelationMap`, `RelationPath`, `Insight`, and `NoteGrid`.

经典结构模型建议按问题选择，避免重复堆叠：

- `FrameworkModel`：一分为几、多因素并列、阶段、分层或循环；用 `type="elements|stages|layers|cycle"` 区分结构。
- `MatrixModel`：两个关键元素组成的二维象限，例如重要/紧急、增长率/市场份额。
- `FormulaModel`：用公式表达变量之间的乘加减关系，例如业绩、价值或行为模型。
- `PyramidModel`：从基础到顶层的分层归纳，例如学习目标、需求层次或论证结构。
- `FunnelModel`：从输入到筛选、转化、结果的逐步收敛，例如 AIDA 或销售漏斗。

原有 `Flow`、`DecisionMatrix`、`Compare`、`Timeline` 继续保留，用于兼容已有内容；新内容优先使用上面的模型组件表达“关键元素与结构”的关系。

## Relation types (whitelist — only these render)

Write cross-branch `Relation`s with `type` from this exact list. Any other value renders no styled edge.

| type | label | use for |
| --- | --- | --- |
| `prerequisite` | 前置知识 | knowledge required before this concept |
| `causes` | 因果推动 | one concept triggers a state change in another |
| `produces` | 产出生成 | a stage outputs an artifact or entity |
| `uses` | 消费使用 | a concept consumes or calls another |
| `implements` | 实现关系 | a concrete mechanism implements an abstraction |
| `contrasts` | 对比关系 | side-by-side contrast (no arrowhead) |
| `depends-on` | 依赖关系 | runtime/effect depends on an external condition |
| `exception-of` | 异常/反例 | a boundary case, counterexample, or broken assumption |
| `precedes` | 时序先后 | pipeline or temporal ordering |

Do **not** write `parent-child` as a `Relation`; the tree edge is generated automatically from `parent` / `Children`. Add a short `label` to every relation so the graph edge is readable.

## Levels L0–L4

| Level | name | role | typical components |
| --- | --- | --- | --- |
| `L0` | 全局概览 | system-wide framing and the root claim | `Definition`, `Prerequisite`, `LearningObjectives`, `KeyQuestion`, `Input`/`Output`, `Callout`, `Tabs` |
| `L1` | 主要阶段 / 子系统 | major lifecycle stage or subsystem | `Definition`, `Input`/`Output`, `Example`, `Children` |
| `L2` | 局部机制 | concrete mechanism and flow | `Definition`, `Mechanism`, `Details`, `Evidence`, `Invariant`, `Tradeoff`, `FailureMode` |
| `L3` | 实现细节 | algorithm, data structure, or code | `Definition`, `Example`, `Glossary` |
| `L4` | 边界与反例 | boundary, exception, or counterexample | `Callout(danger/warn)`, `Example`, `FailureMode` |

## Density targets

Match the exemplar (`assets/template/content/compile-runtime.mdx`):

- 1 `L0` root, 4–5 `L1` branches, 2–3 children per branch, ~15–25 nodes total.
- Every key node: 3–6 semantic components; `L3`/`L4` nodes may be leaner but still concrete.
- At least a few nodes per document carry `Evidence`, `Invariant`, or `FailureMode` with a real command/observation.
- ~8–15 cross-branch `Relation`s, each with a `label`.

## Request priorities

The portable template covers the core `req.md` contract, node exploration, graph view, semantic relations, search, level/relation filters, URL node state, browsing history, keyboard shortcuts, Mermaid zoom, and responsive rendering. Evidence-oriented components and compact tradeoffs cover the highest-value `request.md` enhancements without adding permanent side panels.
