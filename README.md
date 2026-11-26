# Concept Atlas Dense Explain

`concept-atlas-dense-explain` 是一个面向 AI agent 的知识讲解 skill：它把主题组织成语义化 MDX，再编译为可独立打开的交互式 HTML。

它适合生成：

- 技术原理与系统架构讲解
- 概念地图、知识树和分层教程
- 带流程、矩阵、时间线或关系图的交互式说明页
- 需要从总览逐层下钻的复杂主题

## 核心能力

- **语义优先**：内容只描述概念、层级、证据和关系，默认不直接编写 CSS、坐标或 SVG；只有用户明确要求手工布局时才使用自由定位 prop。
- **概念缩放**：通过 `L0`–`L4` 组织从全局概览、主要阶段、局部机制到实现细节和边界反例的认知路径。
- **知识类型**：节点可用可选的 `kind`（`system`/`stage`/`mechanism`/`artifact`/`failure`/`tool`/`boundary`/`decision`）标注知识角色，与层级正交；知识网络页可按类型筛选，校验器可对机制与故障节点执行可选契约。
- **两种页面模式**：`atlas` 适合概念导航与关系图谱；`scroll` 适合连续阅读的长文档。
- **共享信息组件**：支持 `CodeBlock`（代码、命令与伪代码）、`Insight`、`Flow`、`FrameworkModel`、`MatrixModel`、`Mermaid`、`RelationMap`、`NoteGrid`、`Callout`、`Details`、`Quote`（引用块）、`Columns`、`Grid`、`Stack`、`Tabs`、`CodeTabs`（多段代码切换）、`AnnotatedCode`（行标注代码）、`PropertyList`（规格表）、`TreeView`（层级树）和 `Checklist`（验证清单）等组件。
- **学习闭环与溯源**：`LearningObjectives`/`KeyQuestion` 开场，`WorkedExample`/`Step` 逐步推演，`Quiz` 即时自测，`KeyTakeaways` 收束；`Source`/`Confidence` 标注来源类型与置信度，`Term` 提供行内术语释义。
- **数据与行为模型**：`DataTable`（中立表格）、`Metric`（头条数字）、`StateMachine`（状态迁移）、`DecisionTree`（分支决策）、`FeedbackLoop`（反馈回路）和 `CodeDiff`（改动对比）。
- **扩展能力**：`Math`/`MathBlock`（KaTeX 公式）、`Chart`（bar/line/pie 图表）、`Figure`/`FigureRef`（配图与自动图号）、`Cite`/`References`（引用与文献）、`LastReviewed`（审阅日期）。
- **阅读体验可配置**：`scroll` 把正文收进一条居中阅读柱，左边缘悬停即出目录面板，并自动生成阅读进度；`fontSize`/`scale`/`lineHeight` 可调正文大小。
- **外观系统**：读者可随时切换配色皮肤（`aurora` 极光冷调 / `ember` 炉火暖调 / `verdant` 苔原森林 / `sakura` 樱雾粉紫 / `noir` 墨白单色）× 明暗模式 × 组件风格（`manuscript` 手稿排版 / `classic` 经典卡片 / `shadcn` 极简界面 / `elastic` 观测面板），选择在 localStorage 持久化；CLI/环境变量可把默认外观烘焙进产物。
- **内容校验**：CLI 在构建前校验外壳、节点结构、断链、数组形状和资源路径。错误会阻止构建；未知 prop 目前会被静默忽略，因此写作时必须查组件参考。
- **单文件 HTML**：JS/CSS 完全内联，可直接离线打开。字体可能从 Google Fonts 加载，离线时回退到系统字体；Pele 图表也内联进产物，不含图表时则剔除渲染器。本地图片默认外链，需与 `assets/` 一起分发；加 `--inline-assets` 可全部内联，单张图可用 `inline` prop 覆盖。实际体积主要取决于是否使用 KaTeX，以及内联了多少图片。

## 文档导航

- [内容编写指南](docs/FRAMEWORK.md)：选择外壳、编写语义 MDX、使用组件。
- [CLI 与开发指南](docs/USAGE.md)：构建、资源、外观、仓库开发与发布。
- [完整文档索引](docs/README.md)。

## 安装与使用

使用 Skills CLI 安装：

```bash
npx skills add wurenrumian/concept-atlas --skill concept-atlas-dense-explain
```

也可以只生成一次性提示词：

```bash
npx skills use wurenrumian/concept-atlas --skill concept-atlas-dense-explain
```

skill 使用本项目提供的 CLI（npm 包 `concept-atlas-dense-explain`）：

```bash
# 可选：生成可编译组件参考；会同时覆盖输出目录旁的 assets/
npx concept-atlas-dense-explain guide --mode atlas -o atlas-guide.mdx
npx concept-atlas-dense-explain guide --mode scroll -o scroll-guide.mdx

# 生成可交给 AI 改写的 MDX 起始模板
npx concept-atlas-dense-explain create topic.mdx --mode atlas
npx concept-atlas-dense-explain create article.mdx --mode scroll

# 构建前校验内容结构（--json 输出机器可读结果，--strict 提升警告）
npx concept-atlas-dense-explain validate topic.mdx --mode atlas

# 编译为同目录下的独立 HTML（--skin/--default-mode/--style 可烘焙默认外观）
npx concept-atlas-dense-explain topic.mdx --mode atlas
npx concept-atlas-dense-explain article.mdx --mode scroll --skin ember --default-mode light --style manuscript

# 图表（<Mermaid>）由 Pele 内联渲染，不依赖图表 CDN；图片默认外链，需要时全部内联（单张图也可用 inline prop 覆盖）
npx concept-atlas-dense-explain article.mdx --mode scroll --inline-assets
```

使用 `-o` 指定输出路径；已有输出会被直接覆盖，`guide` 还会覆盖输出目录旁的 `assets/`（`--force` 保留为兼容用的空操作）。`create` / `guide` 默认使用 `scroll`；`validate` 和编译省略 `--mode` 时会自动识别 MDX 外壳。校验未通过时构建会被阻止，可用 `--no-validate` 强制跳过。

## 两种页面模式

### `atlas`

以 `ExplainPage`、`ConceptGraph`、`ConceptNode`、`Children`、`ConceptRef` 和 `Relation` 构成概念图谱。适合读者需要在概念之间跳转、查看上下文和理解跨分支关系的主题。

### `scroll`

以 `ScrollDocument`、`ScrollHeader`、`ScrollSection`、`ScrollProse` 和 `ScrollGrid` 构成连续文档。适合教程、文章、研究笔记和需要顺序阅读的内容。

两种模式共享信息组件，但外层页面结构不同；切换模式时只需要转换页面外壳，不要把一个 MDX 文件同时写成两种外壳。

CLI 的 `create` 与 `guide` 默认使用 `scroll` 外壳（`--mode` 缺省即 `scroll`）；需要 `atlas` 时显式传 `--mode atlas`。

## 最小示例

```mdx
<ExplainPage id="my-topic" title="我的主题" summary="一句话说明主题">
  <ConceptGraph root="root">
    <ConceptNode
      id="root"
      title="系统根概念"
      level="L0"
      summary="这里描述主题的全局认知。"
    >
      <Overview>先建立整体范围和阅读路径。</Overview>
      <Children>
        <ConceptRef id="mechanism" />
      </Children>
    </ConceptNode>

    <ConceptNode
      id="mechanism"
      title="核心机制"
      level="L1"
      kind="mechanism"
      parent="root"
      summary="输入经过处理形成输出，并保持关键约束。"
    >
      <Mechanism>输入 → 处理 → 输出</Mechanism>
      <Invariant title="不变量">处理前后必须保持的约束。</Invariant>
    </ConceptNode>
  </ConceptGraph>
</ExplainPage>
```

## 编写原则

- 保持 MDX 语义化，让 agent 或作者专注于知识内容。
- 每个重要概念提供清晰的主张式标题、一句话摘要、证据或机制说明。
- 为 `atlas` 提供一个 `L0` 根节点；按需增加 `L1` 分支和 `Children`/`ConceptRef`，确有跨分支关系时再添加带标签的 `Relation`。
- 为 `scroll` 使用对应的文档外壳，并通过 `spacing="compact|comfortable|airy"` 调整整体节奏。
- 使用组件文档规定的数据结构，例如 `Flow.steps`、`Timeline.events`、表格行和模型数据。

更多组件参数和内容规范见 [docs/FRAMEWORK.md](docs/FRAMEWORK.md)、[docs/USAGE.md](docs/USAGE.md) 与 [docs/README.md](docs/README.md)。
