# AI prompt guide

Include this contract when asking an AI to generate or revise a dense explanation:

```text
先通读 content/compile-runtime.mdx（黄金样例），再产出；不要跳过、不要直接覆盖。
输出语义 MDX，不要输出 CSS、HTML 布局、坐标、SVG 或交互脚本。
先给一个 L0 根节点，再用 L1/L2/L3/L4 表达结构、机制、实现细节和边界。
父子层级使用 parent/Children；跨分支含义使用 Relation。
Relation 的 type 只能是：prerequisite, causes, produces, uses, implements, contrasts, depends-on, exception-of, precedes；每条都要带 label。
每个关键节点优先提供：summary、Definition、Input/Output、Mechanism、一个 Example，以及 Evidence 或 Boundary。
只在确实有帮助时使用组件：Flow 表示顺序，Compare/Tradeoff 表示选择，Timeline 表示时间，Evidence 表示验证，Invariant 表示必须保持的条件，FailureMode 表示故障定位。
首屏只保留核心结论和 3–5 个关键事实；次要解释放进 Details。不要为了“看起来丰富”堆卡片。
规模对齐样例：1 个根、4–5 个 L1、总计约 15–25 个节点、8–15 条 Relation。
证据要具体：真实命令、指标或命名的产物，不要泛泛而谈。
```

## What "good" looks like (from the exemplar)

`assets/template/content/compile-runtime.mdx` is the reference standard. Extract these patterns:

- **Scale**: 1 `L0` + 5 `L1` + ~20 nodes, descending to `L4`.
- **Titles are claims, not nouns**: 「缺页风暴与抖动」, 「ABI 破坏：能链接，不等于能调用」.
- **Every node opens with a one-sentence judgment** in `summary`, then 3–6 components.
- **Concrete evidence**: `readelf -Ws`, `nm -C`, `objdump -dr app.o`, `.bss`, ASLR, build-id.
- **Semantic relations carry the cross-branch meaning**: `produces`, `precedes`, `causes`, `depends-on`, `exception-of`, each labeled.
- **Detail is layered**: first screen = core claim + 3–5 facts; deep detail lives in `Details`, `Tabs`, `Glossary`.

## Density targets

| Metric | Target | Thin (failure) |
| --- | --- | --- |
| `L0` roots | 1 | 0 or many |
| `L1` branches | 4–5 | 1–2 |
| Nodes total | ~15–25 | < 8 |
| Components per key node | 3–6 | 1 |
| Cross-branch `Relation`s | 8–15 | 0–3 |
| Nodes with concrete evidence | several | none |
| Max depth | `L3`/`L4` | only `L0`/`L1` |

## Component selection

| Information shape | Component |
| --- | --- |
| 顺序、阶段、因果链 | `Flow` / `RelationPath` |
| 两到四个对象的同维度比较 | `Compare` |
| 方案、收益、代价、适用条件 | `Tradeoff` / `DecisionMatrix` |
| 时间先后 | `Timeline` |
| 可执行命令和观察结果 | `Evidence` |
| 必须保持的条件 | `Invariant` |
| 症状到原因和修复 | `FailureMode` |
| 次要细节或长解释 | `Details` |

Avoid using more than one primary presentation component in a single node unless the information shapes are genuinely different. Prefer short prose around one useful visual structure over a stack of decorative blocks.

## Minimal generation skeleton

```mdx
<ConceptNode id="mechanism" title="机制：输入如何在约束下变成输出" level="L2" parent="structure" summary="一句话结论">
  <Definition>它是什么，以及为什么重要。</Definition>
  <Mechanism>输入 → 转换 → 输出。</Mechanism>
  <Example title="一个具体案例">名称 + 数值 + 结果，而不是泛指。</Example>
  <Evidence command="tool --inspect target" observes="验证哪个不变量或产物。" />
  <Boundary>何时不成立，或哪些实现细节会改变结论。</Boundary>
</ConceptNode>
```

## Anti-patterns

- **Thin graph**: a handful of nodes with one paragraph each. Fix by adding `L2`/`L3`/`L4` depth.
- **Noun titles / no judgment**: `"缓存"` instead of `"缓存一致性与内存序"`; `summary` missing or restating the title.
- **Generic filler**: "性能会受到影响" instead of a named command, metric, or artifact.
- **Card stacking**: five decorative blocks with no conclusion, evidence, or limitation.
- **Invented types**: `Relation type="related"` — not in the whitelist, renders nothing.
- **Prose instead of structure**: cross-branch links described in a paragraph instead of a labeled `Relation`.

## Before returning the result

Verify the self-check list in `SKILL.md`. In short: 1 root, claim titles, one-line summaries, 3–6 components per key node, concrete evidence, whitelisted relations, layered detail, no layout in MDX, template builds.
