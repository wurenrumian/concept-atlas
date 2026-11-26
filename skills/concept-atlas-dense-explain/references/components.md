# Component and prop reference

Search this file by component name before writing a tag the page has not used yet. The tables below describe the **effective MDX author API**: renderer props plus fields consumed by the atlas semantic model. Reserved/no-op compatibility props are marked explicitly. Defaults that affect output are included. Array props default to `[]` unless stated otherwise; widget props default to `width="auto"`, `height="auto"`, `x={0}`, `y={0}`, and `position="flow"`.

A component missing from the tables does not exist (`UNKNOWN_COMPONENT`). An unknown *prop* is silently ignored — the validator only reports array-shaped props that receive a non-array (`PROP_EXPECTS_ARRAY`) — so check the table instead of guessing. `children` is listed only where the component actually renders it or uses it as a fallback.

The rules that hold for every page — semantic MDX, `kind` contracts, relation types, math braces, figure numbering, cite scoping — are in `SKILL.md`; this file adds the per-component detail.

## Families

- Shell and structure: `ExplainPage`, `ConceptGraph`, `ConceptNode`, `ConceptRef`, `Children`, `Relation`, `ScrollDocument`, `ScrollHeader`, `ScrollSection`, `ScrollProse`, `ScrollPair`, `ScrollGrid`, `ScrollToc`, `Columns`, `Stack`, `Grid`, `Split`
- Node semantics: `Overview`, `Definition`, `Mechanism`, `Implementation`, `CodeBlock`, `Boundary`, `Example`, `Counterexample`, `Prerequisite`, `Input`, `Output`, `Glossary`
- Argument and evidence: `Evidence`, `Invariant`, `FailureMode`, `Tradeoff`, `Checklist`, `LearningObjectives`, `KeyQuestion`
- Learning loop and provenance: `WorkedExample` + `Step`, `Quiz`, `KeyTakeaways`, `Source`, `Confidence`, `LastReviewed`, `Term`
- Information models: `Flow`, `Timeline`, `Compare`, `DecisionMatrix`, `FrameworkModel`, `MatrixModel`, `FormulaModel`, `PyramidModel`, `FunnelModel`
- Data and behaviour: `DataTable`, `Metric`, `PropertyList`, `TreeView`, `StateMachine`, `DecisionTree`, `FeedbackLoop`, `CodeDiff`
- Reading and layout: `Insight`, `Callout`, `Details`, `Quote`, `NoteGrid`, `Tabs`
- Graphics and extensions: `Mermaid`, `RelationMap`, `RelationPath`, `Math`, `MathBlock`, `Chart`, `CodeTabs`, `AnnotatedCode`, `Figure` (alias `Image`), `FigureRef`, `Cite`, `References`

## Props at a glance

### Shell and structure

| Component | Props |
| --- | --- |
| `ExplainPage` | `id`, `title`, `summary`, `layout` = `editorial`, `density` = `reading`, `children` — `layout` / `density` are reserved data attributes with no current visual or model effect; use a static string for `title` if it must become the browser tab title |
| `ConceptGraph` | `root`, `children` — `root` is optional; omission infers the root and warns |
| `ConceptNode` | `id`, `title`, `level` = `L2` (`L0`–`L4`), `parent` = `null`, `summary`, `kind`, `input`, `output`, `children` — `summary`/`kind`/`input`/`output` are consumed by the atlas model |
| `ConceptRef` | `id` |
| `Children` | `children` — a list of `ConceptRef` |
| `Relation` | `from`, `to`, `type` = `depends-on`, `label`, `description`, `children` |
| `ScrollDocument` | `spacing` = `comfortable` (`compact`\|`comfortable`\|`airy`), `fontSize` = `normal` (`compact`\|`normal`\|`large`\|`xlarge`), `scale`, `lineHeight`, `toc` = `true`, `progress` = `true`, `children` |
| `ScrollHeader` | `label` = `连续阅读`, `title`, `children` |
| `ScrollSection` | `title`, `id`, `wide` = `false`, `spacing` = `inherit`, `children` — `wide` is reserved and currently adds no extra width |
| `ScrollProse`, `ScrollPair`, `Columns` | `children` |
| `ScrollGrid` | `columns` = `3` (`2`\|`3`\|`4`), `children` |
| `ScrollToc` | `items` = `[]`, `activeId` = `null`, `title` = `目录`, `onNavigate` — internal shell component; fewer than two items renders nothing |
| `Stack` | `gap` = `md` (`sm`\|`md`\|`lg`), `children` |
| `Grid` | `columns` = `auto` (`auto`\|`2`\|`3`\|`4`), `gap` = `md` (`sm`\|`md`\|`lg`), `children` |
| `Split` | `ratio` = `1fr 1fr`, `children` |

### Node semantics

| Component | Props |
| --- | --- |
| `Overview`, `Definition`, `Mechanism`, `Prerequisite`, `Input`, `Output`, `KeyQuestion` | `children` |
| `Implementation` | `language` = `text`, `title` = `实现代码`, `children` |
| `CodeBlock` | `code`, `language` = `text`, `title`, `caption`, `lineNumbers` = `false`, `wrap` = `false`, `children` — `code` or template-literal children |
| `Boundary`, `Example`, `Counterexample`, `Invariant` | `title`, `children` — defaults: `边界与约束`, `典型示例`, `反例与误区`, `不变量` |
| `Glossary` | `term`, `children` — the definition goes in children |

### Argument, evidence and provenance

| Component | Props |
| --- | --- |
| `Evidence` | `command`, `observes`, `children` — children can supply `observes` when that prop is omitted |
| `FailureMode` | `symptom`, `cause`, `evidence`, `remedy`, `children` |
| `Tradeoff` | `title` = `工程权衡`, `options`, `children` |
| `Checklist` | `title` = `验证清单`, `items`, `children` |
| `LearningObjectives` | `items`, `children` — `items` is an array of strings |
| `WorkedExample` | `title` = `推演过程`, `problem`, `children` — children are `Step` components |
| `Step` | `number`, `title`, `reason`, `children` — omitted numbers are automatic |
| `Quiz` | `question`, `answer`, `tone` = `info`, `children` — children are the explanation |
| `KeyTakeaways` | `title` = `关键要点`, `items`, `children` — `items` is an array of strings |
| `Source` | `kind` = `reference` (`spec`\|`rfc`\|`implementation`\|`experiment`\|`experience`\|`reference`), `label`, `href`, `children` |
| `Confidence` | `level` = `medium` (`high`\|`medium`\|`low`), `basis`, `children` |
| `Term` | `name`, `definition`, `children` — with `name`, children are the definition; without `name`, children are only the term text |
| `LastReviewed` | `date`, `by`, `note` — renders nothing when all three are empty |

### Information models

| Component | Props |
| --- | --- |
| `Flow` | `steps`, `children` |
| `Timeline` | `events`, `children` |
| `Compare` | `items`, `children` |
| `DecisionMatrix` | `title` = `权衡矩阵`, `headers`, `rows`, `children` |
| `FrameworkModel` | `title` = `结构化模型`, `type` = `elements` (`elements`\|`stages`\|`layers`\|`cycle`), `elements`, `question`, `children` |
| `MatrixModel` | `title` = `二维矩阵`, `xLabel` = `横轴`, `yLabel` = `纵轴`, `cells`, `children` |
| `FormulaModel` | `title` = `公式模型`, `formula`, `variables`, `children` |
| `PyramidModel` | `title` = `金字塔模型`, `levels`, `children` |
| `FunnelModel` | `title` = `漏斗模型`, `steps`, `children` |

### Data and behaviour

| Component | Props |
| --- | --- |
| `DataTable` | `title`, `caption`, `headers`, `rows`, `children` |
| `Metric` | `label`, `value`, `unit`, `delta`, `trend` (`up`\|`down`\|`flat`), `note` — omitted `trend` is inferred from `delta` |
| `PropertyList` | `title`, `items`, `children` |
| `TreeView` | `title`, `items`, `children` |
| `StateMachine` | `title` = `状态机`, `initial`, `states`, `transitions`, `children` |
| `DecisionTree` | `title` = `决策路径`, `question`, `branches`, `children` |
| `FeedbackLoop` | `title` = `反馈回路`, `type` = `reinforcing` (`reinforcing`\|`balancing`), `nodes`, `children` |
| `CodeDiff` | `title` = `代码对比`, `language` = `text`, `before`, `after`, `beforeLabel` = `修改前`, `afterLabel` = `修改后`, `caption` |

### Reading, layout and graphics

| Component | Props |
| --- | --- |
| `Insight` | `title` = `关键判断`, `tone` = `info` (`info`\|`success`\|`warn`\|`danger`), `children`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `Callout` | `type` = `info` (`info`\|`success`\|`warn`\|`danger`), `title`, `children` |
| `Details` | `summary` = `详细展开`, `children` |
| `Quote` | `author`, `source`, `href`, `children` |
| `NoteGrid` | `notes`, `children`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `Tabs` | `items`, `children` — children are `<details>` blocks |
| `Mermaid` | `chart` = `''`, `title` = `关系草图`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `RelationMap` | `title` = `关系速览`, `items`, `children`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `RelationPath` | `title` = `关系链`, `steps`, `children` |
| `Math` | `formula`, `children` — children are fine only when they contain no braces; `formula` is safer for backslashes |
| `MathBlock` | `title` = `公式`, `formula`, `variables`, `children` |
| `Chart` | `title` = `图表`, `type` = `bar` (`bar`\|`line`\|`pie`), `data`, `series`, `labels`, `unit` = `''`, `showValues` = `true`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `CodeTabs` | `items`, `title`, `caption`, `lineNumbers` = `false` |
| `AnnotatedCode` | `code`, `language` = `text`, `title`, `caption`, `notes` |
| `Figure`, `Image` | `id`, `src`, `alt` = `''`, `caption`, `label`, `inline`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `FigureRef` | `id`, `children` — children override the automatic label |
| `Cite` | `id`, `children` — children override the automatic citation number |
| `References` | `title` = `参考文献`, `items`, `children` |

## Shapes and traps

Array props are arrays, but not always arrays of objects: some take strings, numbers, or nested arrays. Field names differ per component and are not interchangeable. Unknown props are dropped without a word, so a wrong field name usually shows up as an empty cell, a missing badge, or a card with only its title.

- **Booleans:** prefer a bare prop or `{true}` / `{false}`. Runtime booleans such as `toc="false"` and `showValues="false"` are truthy. The asset plugin also accepts quoted `inline="false"`, but use `inline={false}` for consistency.
- **`Callout` uses `type`, while `Insight` and `Quiz` use `tone`.** Both accept `info` / `success` / `warn` / `danger`; anything else falls back to `info`.
- **`Compare` puts the row labels on the first item only:** `items={[{label, rows: ['行一','行二'], values: ['…','…']}]}`. `label` is the column header, `rows` is read from `items[0]` and shared by every column, and each item's `values[i]` fills row `i`. A missing cell renders `-`; `0`, `false`, and an empty string are preserved. For a free-form side-by-side block instead, use children (e.g. `Columns` + `Split`).
- **`Flow`** takes strings or `{title?, label?, description?}` objects. **`Timeline`** takes `{label?, time?, content?, desc?}`: `label` is primary, `time` is shown beside it when both exist, and `desc` is a legacy fallback for `content`.
- **`FrameworkModel` / `PyramidModel` / `FunnelModel`:** `elements={[{title?, label?, name?, description?}]}`, `levels={[{title?, label?, description?}]}`, and `steps={[{title?, label?, description?}]}`. `FrameworkModel type` labels the model; only `stages` currently adds arrow layout. `cycle` is a semantic label, not a circular layout.
- **`MatrixModel` is the 2×2 quadrant** (`xLabel`, `yLabel`, `cells={[{title?, label?, description?, tone?}]}`, usually four cells); **`DecisionMatrix` is the weighted table** (`headers`, `rows` as arrays of cells). `cells` on a `DecisionMatrix` is silently ignored.
- **`Tradeoff` options carry the verdict:** `options={[{name?, label?, benefit?, cost?, when?}]}` — `when` is the condition under which that option wins.
- **`NoteGrid`** takes `notes={[{title?, label?, content?, text?, description?}]}`; **`Tabs`** takes `items={[{label?, title?, content?}]}` and opens the first tab.
- **`Evidence` is normally a command/observation pair** (`command`, `observes`); children can supply `observes` when the prop is omitted.
- **`Checklist` items** are strings or `{text?, status, note?}` with `status` one of `pass` / `fail` / `unknown` / `todo`. Invalid or omitted statuses become `unknown`.
- **`LearningObjectives` / `KeyTakeaways` items** are arrays of strings.
- **`PropertyList` items** are strings or `{name?, label?, key?, value?, note?}`; **`TreeView` items** are `{label?, title?, description?, children: […]}` (nest to any depth).
- **`StateMachine`** needs `states={[{id, label?, description?, terminal?}]}` and `transitions={[{from, to, event?, guard?}]}` whose `from`/`to` are state ids; `initial` marks the entry state.
- **`DecisionTree` branches** are `{condition?, outcome?, note?, tone?, branches: […]}` — nest `branches` for deeper levels.
- **`FeedbackLoop` nodes** are `{label?, title?, description?}` and `type="balancing"` flips the loop polarity.
- **`Chart`** reads `data={[{label?, x?, value?, y?}]}` or numbers for `bar`/`pie`, and `labels` + `series={[{name?, label?, values}]}` for `line`. Invalid `type` values fall back to `bar`. `unit` is shown in the chart's header badge (`CHART · BAR · ms`), not appended to each value.
- **`RelationMap` items** are `{from?, source?, type, to?, target?, note?}` with `type` from the same whitelist as `Relation`; **`RelationPath` steps** are `{level?, node?, title?, note?, relation?, tone?}`. `node` is the display label (not a node id), and `relation` labels the edge to the next step.
- **`Math`** requires `formula` when children contain braces — MDX reads `{…}` as an expression. Brace-free children such as `<Math>\log_2 N</Math>` work, but `formula` is safer and more consistent. `MathBlock` adds `variables={[{symbol?, name?, description?, value?}]}` and a title.
- **`CodeTabs` items** are `{label?, language?, code?}`; **`AnnotatedCode` notes** are `{line, text?}` and `line` is the 1-based line number in `code`.
- **`Mermaid`** takes the chart as a template literal (`chart={\`flowchart LR …\`}`); keep the backtick wrapper so newlines survive. Readers can open any chart full-screen from the widget head or by clicking the drawing. Pele renders it as an inline SVG, so the page stays offline; its layout differs from Mermaid.js, and `themeVariables` does nothing — colours come from the page theme.
- **Widget props** (`width`, `height`, `x`, `y`, `position`) exist on `Mermaid`, `Chart`, `Figure`, `Image`, `Insight`, `NoteGrid` and `RelationMap`. `position="absolute"` places the widget at `x`/`y` inside its container; any other value keeps it in the flow and uses `x`/`y` as a translate offset. Leave them alone unless the layout asks for it.
- **`ConceptNode` content precedence:** `<Input>` / `<Output>` children override the node's `input` / `output` props. A string-only `<Overview>` supplies `summary` when the prop is omitted.
- **`Relation` precedence differs by carrier:** direct scroll rendering prefers children over `description`; atlas extraction prefers `description` over children. Set `description` explicitly when the same edge must read identically in both carriers.
- **`Term`:** `<Term name="X">定义</Term>` creates a term with a definition. `<Term>X</Term>` only sets the term text and has no definition.
- **`FigureRef` / `Cite` children** override the automatic “图 N” / `[n]` text. Use this sparingly; the automatic labels stay correct when content moves.

## Figures and assets

- A relative `src` (`./assets/diagram.png`) stays a relative link by default; compile with `--inline-assets` to bake every local image in as base64, or set `inline={true}` / `inline={false}` on one figure to override (precedence: per-figure prop > global flag > link). `http(s)` URLs stay links and warn (`ASSET_REMOTE`). Always set `alt`; a missing relative file warns (`ASSET_MISSING`) and shows a placeholder. Readers can click a figure to open it full-screen (zoom, drag, `Esc`) — mention it for diagram-heavy pages.
- **Figure numbering**: give a figure an `id` and reference it with `<FigureRef id="..." />` to render "图 N". Numbering follows document order (per node in `atlas`, whole document in `scroll`) and reflows automatically, so never hand-write "图 1"; an explicit `label` still wins. A ref with no matching `id` warns (`FIGURE_REF_UNRESOLVED`).
- **Figure size & cost**: linking keeps the HTML small, but the relative `src` must resolve from the output HTML location; keep the needed `assets/` beside the HTML or adjust the path. The CLI warns when `-o` points outside the MDX directory. Inlining is what makes a screenshot-heavy page large (a page with no heavy renderers otherwise lands near 250KB). An asset over 512KB warns (`ASSET_LARGE`) when inlined by the global flag or a per-figure `inline` prop. Decide the trade-off with the user instead of choosing silently.

## Cite and References

`<Cite id="..." />` renders `[n]` from the matching item's position in `<References items={...} />`, where each item is `{id, authors?, year?, title?, url?, source?, note?}`. In `scroll`, `References` can sit anywhere. In `atlas`, keep the cites and the `References` block in the same node, because node content only renders when that node is open.
