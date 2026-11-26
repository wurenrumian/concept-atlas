# 组件与 prop 参考

不要通读本文件。先搜索组件名，只读命中的 props 行；涉及数组 prop 时，再到 `Shapes and traps` 搜索同名组件。只有需要完整组合示例时，才到 guide 中搜索该组件名。

下表描述的是 **有效的 MDX 作者 API**：渲染器 prop，以及 atlas 语义模型使用的字段。预留/空操作的兼容 prop 已明确标出。会影响输出的默认值也已列出。除非另有说明，数组 prop 默认为 `[]`；可视化组件 prop 默认为 `width="auto"`、`height="auto"`、`x={0}`、`y={0}` 和 `position="flow"`。

表中未列出的组件不存在（`UNKNOWN_COMPONENT`）。未知 *prop* 会被静默忽略——校验器只报告接收非数组的数组形状 prop（`PROP_EXPECTS_ARRAY`）——因此请查表，不要猜测。`children` 只在组件实际渲染它或将其用作回退时列出。

适用于每个页面的规则——语义 MDX、`kind` 契约、关系类型、数学花括号、图编号、引用作用域——见 `SKILL.md`；本文件补充各组件细节。

## 最短查询路径

1. 搜索组件名，读取 `Props at a glance` 中的对应行。
2. 如果 prop 是数组，或行为依赖字段名，再搜索 `Shapes and traps` 下的同名条目。
3. 如果不确定如何组合，搜索对应 guide 中的组件名，只读附近示例。
4. 仍然不确定时，才读取该组件所属分类的完整章节。

## 按任务速查

| 当前任务 | 先搜索 |
| --- | --- |
| 选择页面外壳、搭建结构 | `ExplainPage`、`ScrollDocument`、`ConceptGraph`、`ConceptNode`、`Children`、`ConceptRef`、`Relation`、`ScrollHeader`、`ScrollSection` |
| 定义、机制与上下文 | `Overview`、`Definition`、`Mechanism`、`Implementation`、`CodeBlock`、`Boundary`、`Example`、`Counterexample`、`Prerequisite`、`Input`、`Output`、`Glossary` |
| 证据、判断与学习闭环 | `Evidence`、`Invariant`、`FailureMode`、`Tradeoff`、`Checklist`、`LearningObjectives`、`KeyQuestion`、`WorkedExample`、`Step`、`Quiz`、`KeyTakeaways` |
| 来源、置信度与术语 | `Source`、`Confidence`、`LastReviewed`、`Term`、`Cite`、`References` |
| 顺序、时间、比较与决策 | `Flow`、`Timeline`、`Compare`、`DecisionMatrix`、`Tradeoff`、`DecisionTree` |
| 结构化模型与公式 | `FrameworkModel`、`MatrixModel`、`FormulaModel`、`PyramidModel`、`FunnelModel`、`Math`、`MathBlock` |
| 数据、状态与行为 | `DataTable`、`Metric`、`PropertyList`、`TreeView`、`StateMachine`、`DecisionTree`、`FeedbackLoop`、`CodeDiff` |
| 代码、图表与配图 | `CodeBlock`、`Implementation`、`CodeTabs`、`AnnotatedCode`、`CodeDiff`、`Chart`、`Figure`、`FigureRef` |
| 布局、折叠与关系可视化 | `ScrollProse`、`ScrollPair`、`ScrollGrid`、`ScrollToc`、`Columns`、`Stack`、`Grid`、`Split`、`Insight`、`Callout`、`Details`、`Quote`、`NoteGrid`、`Tabs`、`Mermaid`、`RelationMap`、`RelationPath` |

## Props at a glance（props 速览）

### 页面外壳与结构

| 组件 | Props |
| --- | --- |
| `ExplainPage` | `id`, `title`, `summary`, `layout` = `editorial`, `density` = `reading`, `children` — `layout` / `density` 是预留的数据属性，目前没有视觉或模型效果（reserved data attributes with no current visual or model effect）；若 `title` 必须成为浏览器标签页标题，请使用静态字符串 |
| `ConceptGraph` | `root`, `children` — `root` 可选；省略时会推断根节点并发出警告 |
| `ConceptNode` | `id`, `title`, `level` = `L2` (`L0`–`L4`), `parent` = `null`, `summary`, `kind`, `input`, `output`, `children` — `summary`/`kind`/`input`/`output` 由 atlas 语义模型读取 |
| `ConceptRef` | `id` |
| `Children` | `children` — 一组 `ConceptRef` |
| `Relation` | `from`, `to`, `type` = `depends-on`, `label`, `description`, `children` |
| `ScrollDocument` | `spacing` = `comfortable` (`compact`\|`comfortable`\|`airy`), `fontSize` = `normal` (`compact`\|`normal`\|`large`\|`xlarge`), `scale`, `lineHeight`, `toc` = `true`, `progress` = `true`, `children` |
| `ScrollHeader` | `label` = `连续阅读`, `title`, `children` |
| `ScrollSection` | `title`, `id`, `wide` = `false`, `spacing` = `inherit`, `children` — `wide` 是预留属性，目前不会增加额外宽度 |
| `ScrollProse`, `ScrollPair`, `Columns` | `children` |
| `ScrollGrid` | `columns` = `3` (`2`\|`3`\|`4`), `children` |
| `ScrollToc` | `items` = `[]`, `activeId` = `null`, `title` = `目录`, `onNavigate` — 内部页面外壳组件；少于两项时不渲染任何内容 |
| `Stack` | `gap` = `md` (`sm`\|`md`\|`lg`), `children` |
| `Grid` | `columns` = `auto` (`auto`\|`2`\|`3`\|`4`), `gap` = `md` (`sm`\|`md`\|`lg`), `children` |
| `Split` | `ratio` = `1fr 1fr`, `children` |

### 节点语义

| 组件 | Props |
| --- | --- |
| `Overview`, `Definition`, `Mechanism`, `Prerequisite`, `Input`, `Output`, `KeyQuestion` | `children` |
| `Implementation` | `language` = `text`, `title` = `实现代码`, `children` |
| `CodeBlock` | `code`, `language` = `text`, `title`, `caption`, `lineNumbers` = `false`, `wrap` = `false`, `children` — `code` 或模板字面量形式的 children |
| `Boundary`, `Example`, `Counterexample`, `Invariant` | `title`, `children` — 默认值：`边界与约束`、`典型示例`、`反例与误区`、`不变量` |
| `Glossary` | `term`, `children` — 定义放在 children 中 |

### 论证、证据与来源

| 组件 | Props |
| --- | --- |
| `Evidence` | `command`, `observes`, `children` — 省略该 prop 时，children 可提供 `observes` |
| `FailureMode` | `symptom`, `cause`, `evidence`, `remedy`, `children` |
| `Tradeoff` | `title` = `工程权衡`, `options`, `children` |
| `Checklist` | `title` = `验证清单`, `items`, `children` |
| `LearningObjectives` | `items`, `children` — `items` 是字符串数组 |
| `WorkedExample` | `title` = `推演过程`, `problem`, `children` — children 是 `Step` 组件 |
| `Step` | `number`, `title`, `reason`, `children` — 省略编号时自动生成 |
| `Quiz` | `question`, `answer`, `tone` = `info`, `children` — children 是解释 |
| `KeyTakeaways` | `title` = `关键要点`, `items`, `children` — `items` 是字符串数组 |
| `Source` | `kind` = `reference` (`spec`\|`rfc`\|`implementation`\|`experiment`\|`experience`\|`reference`), `label`, `href`, `children` |
| `Confidence` | `level` = `medium` (`high`\|`medium`\|`low`), `basis`, `children` |
| `Term` | `name`, `definition`, `children` — 提供 `name` 时，children 是定义；不提供 `name` 时，children 仅是术语文本 |
| `LastReviewed` | `date`, `by`, `note` — 三者均为空时不渲染任何内容 |

### 信息模型

| 组件 | Props |
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

### 数据与行为

| 组件 | Props |
| --- | --- |
| `DataTable` | `title`, `caption`, `headers`, `rows`, `children` |
| `Metric` | `label`, `value`, `unit`, `delta`, `trend` (`up`\|`down`\|`flat`), `note` — 省略 `trend` 时，根据 `delta` 推断 |
| `PropertyList` | `title`, `items`, `children` |
| `TreeView` | `title`, `items`, `children` |
| `StateMachine` | `title` = `状态机`, `initial`, `states`, `transitions`, `children` |
| `DecisionTree` | `title` = `决策路径`, `question`, `branches`, `children` |
| `FeedbackLoop` | `title` = `反馈回路`, `type` = `reinforcing` (`reinforcing`\|`balancing`), `nodes`, `children` |
| `CodeDiff` | `title` = `代码对比`, `language` = `text`, `before`, `after`, `beforeLabel` = `修改前`, `afterLabel` = `修改后`, `caption` |

### 阅读、布局与图形

| 组件 | Props |
| --- | --- |
| `Insight` | `title` = `关键判断`, `tone` = `info` (`info`\|`success`\|`warn`\|`danger`), `children`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `Callout` | `type` = `info` (`info`\|`success`\|`warn`\|`danger`), `title`, `children` |
| `Details` | `summary` = `详细展开`, `children` |
| `Quote` | `author`, `source`, `href`, `children` |
| `NoteGrid` | `notes`, `children`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `Tabs` | `items`, `children` — children 是 `<details>` 块 |
| `Mermaid` | `chart` = `''`, `title` = `关系草图`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `RelationMap` | `title` = `关系速览`, `items`, `children`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `RelationPath` | `title` = `关系链`, `steps`, `children` |
| `Math` | `formula`, `children` — children 只有在不含花括号时才能正常使用；处理反斜杠时 `formula` 更安全 |
| `MathBlock` | `title` = `公式`, `formula`, `variables`, `children` |
| `Chart` | `title` = `图表`, `type` = `bar` (`bar`\|`line`\|`pie`), `data`, `series`, `labels`, `unit` = `''`, `showValues` = `true`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `CodeTabs` | `items`, `title`, `caption`, `lineNumbers` = `false` |
| `AnnotatedCode` | `code`, `language` = `text`, `title`, `caption`, `notes` |
| `Figure`, `Image` | `id`, `src`, `alt` = `''`, `caption`, `label`, `inline`, `width` = `auto`, `height` = `auto`, `x` = `0`, `y` = `0`, `position` = `flow` |
| `FigureRef` | `id`, `children` — children 覆盖自动标签 |
| `Cite` | `id`, `children` — children 覆盖自动引用编号 |
| `References` | `title` = `参考文献`, `items`, `children` |

## Shapes and traps（数组形状与陷阱）

数组 prop 必须是数组，但不一定是对象数组：有些接收字符串、数字或嵌套数组。各组件的字段名不同，不能互换。未知 prop 会被直接丢弃，不会给出提示，因此字段名写错通常表现为空单元格、缺失的徽标或只有标题的卡片。

- **布尔值：** 优先使用裸 prop 或 `{true}` / `{false}`。诸如 `toc="false"` 和 `showValues="false"` 的运行时布尔值为真。资源插件也接受带引号的 `inline="false"`，但为保持一致，请使用 `inline={false}`。
- **`Callout` 使用 `type`，而 `Insight` 和 `Quiz` 使用 `tone`。** 两者都接受 `info` / `success` / `warn` / `danger`；其他值会回退为 `info`。
- **`Compare` 的行标签只放在第一项：** `items={[{label, rows: ['行一','行二'], values: ['…','…']}]}`。`label` 是列标题，`rows` 从 `items[0]` 读取并由所有列共享，每项的 `values[i]` 填充第 `i` 行。缺失的单元格渲染为 `-`；`0`、`false` 和空字符串会保留。若改用自由形式的并排块，请使用 children（例如 `Columns` + `Split`）。
- **`Flow`** 接收字符串或 `{title?, label?, description?}` 对象。**`Timeline`** 接收 `{label?, time?, content?, desc?}`：`label` 是主要文本，两者都存在时 `time` 显示在其旁，`desc` 是 `content` 的旧版回退字段。
- **`FrameworkModel` / `PyramidModel` / `FunnelModel`：** `elements={[{title?, label?, name?, description?}]}`、`levels={[{title?, label?, description?}]}` 和 `steps={[{title?, label?, description?}]}`。`FrameworkModel type` 表示模型类型；目前只有 `stages` 会添加箭头布局。`cycle` 是语义标签，不是圆形布局。
- **`MatrixModel` 是 2×2 四象限**（`xLabel`、`yLabel`、`cells={[{title?, label?, description?, tone?}]}`，通常为四个单元格）；**`DecisionMatrix` 是加权表格**（`headers`、以单元格数组表示的 `rows`）。`DecisionMatrix` 上的 `cells` 会被静默忽略。
- **`Tradeoff` 的选项包含适用判断：** `options={[{name?, label?, benefit?, cost?, when?}]}`——`when` 是该选项胜出的条件。
- **`NoteGrid`** 接收 `notes={[{title?, label?, content?, text?, description?}]}`；**`Tabs`** 接收 `items={[{label?, title?, content?}]}`，并打开第一个标签页。
- **`Evidence` 通常是命令/观察对**（`command`、`observes`）；省略该 prop 时，children 可提供 `observes`。
- **`Checklist` 的 `items`** 是字符串或 `{text?, status, note?}`，其中 `status` 为 `pass` / `fail` / `unknown` / `todo` 之一。无效或省略的 status 会变为 `unknown`。
- **`LearningObjectives` / `KeyTakeaways` 的 `items`** 是字符串数组。
- **`PropertyList` 的 `items`** 是字符串或 `{name?, label?, key?, value?, note?}`；**`TreeView` 的 `items`** 是 `{label?, title?, description?, children: […]}`（可嵌套任意深度）。
- **`StateMachine`** 需要 `states={[{id, label?, description?, terminal?}]}` 和 `transitions={[{from, to, event?, guard?}]}`，其中 `from`/`to` 是状态 id；`initial` 标记入口状态。
- **`DecisionTree` 的 `branches`** 是 `{condition?, outcome?, note?, tone?, branches: […]}`——嵌套 `branches` 可表示更深层级。
- **`FeedbackLoop` 的 `nodes`** 是 `{label?, title?, description?}`，`type="balancing"` 会翻转回路极性。
- **`Chart`** 的 `bar`/`pie` 类型读取 `data={[{label?, x?, value?, y?}]}`，数组元素也可以是数字；`line` 类型读取 `labels` + `series={[{name?, label?, values}]}`。无效的 `type` 值会回退为 `bar`。`unit` 显示在图表标题的徽标中（`CHART · BAR · ms`），不会追加到每个值后。
- **`RelationMap` 的 `items`** 是 `{from?, source?, type, to?, target?, note?}`，其中 `type` 来自与 `Relation` 相同的白名单；**`RelationPath` 的 `steps`** 是 `{level?, node?, title?, note?, relation?, tone?}`。`node` 是显示标签（不是节点 id），`relation` 标记通往下一步的边。
- **`Math`** 在 children 含花括号时必须提供 `formula`——MDX 会把 `{…}` 读取为表达式。像 `<Math>\log_2 N</Math>` 这样不含花括号的 children 可用，但 `formula` 更安全且更一致。`MathBlock` 添加 `variables={[{symbol?, name?, description?, value?}]}` 和标题。
- **`CodeTabs` 的 `items`** 是 `{label?, language?, code?}`；**`AnnotatedCode` 的 `notes`** 是 `{line, text?}`，`line` 是 `code` 中从 1 开始的行号。
- **`Mermaid`** 将图表作为模板字面量传入（`chart={\`flowchart LR …\`}`）；保留反引号包裹层，确保换行保留。读者可从组件标题栏或点击图形打开全屏图表。Pele 将其渲染为内联 SVG，因此图表可离线渲染；其布局与 Mermaid.js 不同，`themeVariables` 不起作用（空操作）——颜色来自页面主题。
- **组件 prop**（`width`、`height`、`x`、`y`、`position`）存在于 `Mermaid`、`Chart`、`Figure`、`Image`、`Insight`、`NoteGrid` 和 `RelationMap` 上。`position="absolute"` 将组件放在其容器内的 `x`/`y` 处；其他值使其保持在文档流中，并将 `x`/`y` 用作平移偏移。除非布局需要，否则不要改动这些 prop。
- **`ConceptNode` 的内容优先级：** `<Input>` / `<Output>` children 覆盖节点的 `input` / `output` prop。仅含字符串的 `<Overview>` 会在省略 prop 时提供 `summary`。
- **`Relation` 的优先级因页面外壳而异：** 直接滚动渲染优先使用 children 而非 `description`；atlas 提取优先使用 `description` 而非 children。若同一条边在两种页面外壳中必须显示一致，请显式设置 `description`。
- **`Term`：** `<Term name="X">定义</Term>` 创建带定义的术语。`<Term>X</Term>` 只设置术语文本，没有定义。
- **`FigureRef` / `Cite` 的 children** 覆盖自动的“图 N” / `[n]` 文本。请谨慎使用；内容移动时，自动标签仍能保持正确。

## 配图与资源

- 相对 `src`（`./assets/diagram.png`）默认保持相对链接；使用 `--inline-assets` 编译可将每张本地图片内联为 base64，或在单张图上设置 `inline={true}` / `inline={false}` 进行覆盖（优先级：单图 prop > 全局参数 > 链接）。`http(s)` URL 保持链接并发出警告（`ASSET_REMOTE`）。务必设置 `alt`；相对文件缺失会发出警告（`ASSET_MISSING`）并显示占位符。读者可点击图片全屏打开（缩放、拖动、`Esc`）——在配图密集的页面上应提及此功能。
- **图编号：** 给图设置 `id`，并用 `<FigureRef id="..." />` 引用，以渲染“图 N”。编号遵循文档顺序（`atlas` 中按节点，`scroll` 中按整份文档），并会自动重排，因此不要手写“图 1”；显式 `label` 仍优先。没有匹配 `id` 的引用会发出警告（`FIGURE_REF_UNRESOLVED`）。
- **图大小与成本：** 外链可保持 HTML 较小，但相对 `src` 必须从输出 HTML 的位置正确解析；请将需要的 `assets/` 放在 HTML 旁或调整路径。当 `-o` 指向 MDX 目录之外时，CLI 会发出警告。内联会使截图密集的页面变大（否则，不含重型渲染器的页面通常接近 250KB）。当资源经全局参数或单图 `inline` prop 内联且超过 512KB 时，会发出警告（`ASSET_LARGE`）。请与用户商定取舍，不要静默选择。

## Cite 与 References

`<Cite id="..." />` 根据匹配项在 `<References items={...} />` 中的位置渲染 `[n]`，其中每项为 `{id, authors?, year?, title?, url?, source?, note?}`。在 `scroll` 中，`References` 可放在任意位置。在 `atlas` 中，请将引用和 `References` 块放在同一节点内，因为节点内容只在该节点展开时渲染。
