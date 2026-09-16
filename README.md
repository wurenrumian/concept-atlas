# Concept Atlas Dense Explain

`concept-atlas-dense-explain` 是一个面向 AI agent 的知识讲解 skill：它把主题组织成语义化 MDX，再编译为可独立打开的交互式 HTML。

它适合生成：

- 技术原理与系统架构讲解
- 概念地图、知识树和分层教程
- 带流程、矩阵、时间线或关系图的交互式说明页
- 需要从总览逐层下钻的复杂主题

## 核心能力

- **语义优先**：内容只描述概念、层级、证据和关系，不直接编写 CSS、布局、坐标或 SVG。
- **概念缩放**：通过 `L0`–`L4` 组织从全局概览、主要阶段、局部机制到实现细节和边界反例的认知路径。
- **两种页面模式**：`atlas` 适合概念导航与关系图谱；`scroll` 适合连续阅读的长文档。
- **共享信息组件**：支持 `Insight`、`Flow`、`FrameworkModel`、`MatrixModel`、`Mermaid`、`RelationMap`、`NoteGrid`、`Callout`、`Details`、`Columns`、`Grid`、`Stack` 和 `Tabs` 等组件。
- **扩展能力**：`Math`/`MathBlock`（KaTeX 公式）、`Chart`（bar/line/pie 图表）、`Figure`（构建时内联图片）、`Cite`/`References`（引用与文献）。
- **阅读体验可配置**：`scroll` 自动生成侧栏目录和阅读进度，并支持 `fontSize`/`scale`/`lineHeight` 调整正文大小。
- **内容校验**：CLI 在构建前校验结构，断链、重复 id、缺失字段和错误 prop 会直接报错。
- **单文件输出**：MDX 可直接编译为无需额外运行时的独立 `.html` 文件。

## 安装与使用

发布到 GitHub 后，可以使用 Skills CLI 安装：

```bash
npx skills add <github-owner>/<github-repo> --skill concept-atlas-dense-explain
```

也可以只生成一次性提示词：

```bash
npx skills use <github-owner>/<github-repo> --skill concept-atlas-dense-explain
```

skill 使用本项目提供的 CLI：

```bash
# 先取一份可编译的组件参考（guide 顶部有中文 LaTeX 使用说明），学习组件与 prop 写法
npx concept-atlas-dense-explain guide --mode atlas -o atlas-guide.mdx
npx concept-atlas-dense-explain guide --mode scroll -o scroll-guide.mdx

# 生成可交给 AI 改写的 MDX 起始模板
npx concept-atlas-dense-explain create topic.mdx --mode atlas
npx concept-atlas-dense-explain create article.mdx --mode scroll

# 构建前校验内容结构（--json 输出机器可读结果，--strict 提升警告）
npx concept-atlas-dense-explain validate topic.mdx --mode atlas

# 编译为同目录下的独立 HTML
npx concept-atlas-dense-explain topic.mdx --mode atlas
npx concept-atlas-dense-explain article.mdx --mode scroll
```

使用 `-o` 指定输出路径，使用 `--force` 覆盖已有文件。校验未通过时构建会被阻止，可用 `--no-validate` 强制跳过。

## 两种页面模式

### `atlas`

以 `ExplainPage`、`ConceptGraph`、`ConceptNode`、`Children`、`ConceptRef` 和 `Relation` 构成概念图谱。适合读者需要在概念之间跳转、查看上下文和理解跨分支关系的主题。

### `scroll`

以 `ScrollDocument`、`ScrollHeader`、`ScrollSection`、`ScrollProse` 和 `ScrollGrid` 构成连续文档。适合教程、文章、研究笔记和需要顺序阅读的内容。

两种模式共享信息组件，但外层页面结构不同；切换模式时只需要转换页面外壳，不要把一个 MDX 文件同时写成两种外壳。

## 最小示例

```mdx
<ExplainPage id="my-topic" title="我的主题" summary="一句话说明主题">
  <ConceptGraph root="root">
    <ConceptNode id="root" title="系统根概念" level="L0">
      <Overview>这里描述主题的全局认知。</Overview>
      <Children>
        <ConceptRef id="mechanism" />
      </Children>
    </ConceptNode>

    <ConceptNode id="mechanism" title="核心机制" level="L1" parent="root">
      <Mechanism>输入 → 处理 → 输出</Mechanism>
    </ConceptNode>

    <Relation from="root" to="mechanism" type="precedes" label="先于" />
  </ConceptGraph>
</ExplainPage>
```

## 编写原则

- 保持 MDX 语义化，让 agent 或作者专注于知识内容。
- 每个重要概念提供清晰的主张式标题、一句话摘要、证据或机制说明。
- 为 `atlas` 提供一个 `L0` 根节点、多个 `L1` 分支、`Children`/`ConceptRef` 和带标签的 `Relation`。
- 为 `scroll` 使用对应的文档外壳，并通过 `spacing="compact|comfortable|airy"` 调整整体节奏。
- 使用组件文档规定的数据结构，例如 `Flow.steps`、`Timeline.events`、表格行和模型数据。

更多组件参数和内容规范见 [docs/FRAMEWORK.md](docs/FRAMEWORK.md) 与 [docs/USAGE.md](docs/USAGE.md)。
