# Concept Atlas 内容编写指南

Concept Atlas 用语义化 MDX 描述知识结构、证据和关系，再把它们编译成交互式 HTML。内容作者只决定“这一块信息是什么”，渲染器负责布局、导航、主题和交互。

完整组件 API 见 [`skills/concept-atlas-dense-explain/references/components.md`](../skills/concept-atlas-dense-explain/references/components.md)；CLI 命令见 [`USAGE.md`](./USAGE.md)。

## 1. 先选页面外壳

`atlas` 和 `scroll` 共享同一套内容组件，区别只在阅读路径。

| 读者任务 | 外壳 | 必要结构 |
| --- | --- | --- |
| 探索概念、比较分支、追踪关系 | `atlas` | `ExplainPage` → `ConceptGraph` → `ConceptNode` |
| 顺序阅读论证、教程、过程或报告 | `scroll` | `ScrollDocument` → `ScrollHeader` + `ScrollSection` |
| 已有 MDX | 保持当前外壳 | 只在用户要求时转换外层结构 |

一个文件只能使用一种外壳。切换外壳时转换外层结构，不重写内部语义组件。

## 2. Atlas：概念树与关系

Atlas 用概念树组织下钻路径，用 `Relation` 表达跨分支关系。

```mdx
<ExplainPage
  id="http-request"
  title="HTTP 请求如何完成一次交互"
  summary="从请求意图到服务端响应，追踪关键阶段和约束。"
>
  <ConceptGraph root="request">
    <ConceptNode
      id="request"
      title="一次 HTTP 请求"
      level="L0"
      summary="客户端通过结构化消息请求资源或触发操作。"
    >
      <Overview>先建立全局过程和直觉。</Overview>
      <Definition>请求是客户端发往服务端的结构化消息。</Definition>
      <Flow steps={[
        {title: '构造', description: '确定方法、目标和请求头'},
        {title: '传输', description: '通过连接发送请求消息'},
        {title: '处理', description: '服务端校验并执行业务逻辑'},
        {title: '响应', description: '返回状态、头部和消息体'}
      ]} />
      <Children><ConceptRef id="request-line" /></Children>
    </ConceptNode>

    <ConceptNode
      id="request-line"
      title="请求行"
      level="L1"
      parent="request"
      summary="请求行声明方法、目标资源和协议版本。"
    >
      <Definition>请求行是请求消息的起始部分。</Definition>
      <Example title="典型请求">GET /users HTTP/1.1</Example>
    </ConceptNode>
  </ConceptGraph>
</ExplainPage>
```

层级表示认知深度，不表示视觉字号：

| 层级 | 用途 |
| --- | --- |
| `L0` | 全局主题，整篇文档只有一个 |
| `L1` | 主要阶段、子系统或分支 |
| `L2` | 局部机制 |
| `L3` | 实现细节 |
| `L4` | 边界、反例和异常情况 |

`parent` 决定树归属，`Children` / `ConceptRef` 声明下钻入口。不要用 `Relation` 重复表达父子关系。

### 知识类型 `kind`

`level` 表示“位于哪一层”，`kind` 表示“在论证中扮演什么角色”，两者正交。

| `kind` | 含义 |
| --- | --- |
| `system` | 整体系统、产品或问题域 |
| `stage` | 生命周期阶段、处理步骤或子系统 |
| `mechanism` | 可解释、可验证的工作机制 |
| `artifact` | 阶段产出的实体、数据或文件 |
| `failure` | 失败模式、异常与边界情况 |
| `tool` | 工具、库或外部依赖 |
| `boundary` | 约束、前提、限制与非目标 |
| `decision` | 设计取舍与选择点 |

`kind` 可选。声明 `mechanism` 时建议提供 `Invariant` 或 `Evidence`；声明 `failure` 时建议使用结构化 `FailureMode`。`--strict` 会把这两项未满足契约升级为错误。

### 概念关系

`Relation` 表达不属于树结构的关系，类型包括：

```text
prerequisite  前置知识
causes        因果推动
produces      产出生成
uses          消费使用
implements    实现关系
precedes      时序先后
depends-on    依赖关系
contrasts     对比关系
exception-of  异常或反例
```

每条关系都需要一个面向读者的 `label`，例如：

```mdx
<Relation
  from="lexer"
  to="ast"
  type="produces"
  label="生成"
  description="词法和语法分析共同为 AST 提供输入。"
/>
```

## 3. Scroll：连续阅读

Scroll 用章节组织阅读顺序，共享组件直接放在章节中。

```mdx
<ScrollDocument spacing="comfortable" fontSize="normal">
  <ScrollHeader title="如何做一次技术判断">
    先说明问题、背景和读者最终要带走的判断。
  </ScrollHeader>

  <ScrollSection title="先定义问题">
    <ScrollProse>解释范围、输入和关键约束。</ScrollProse>
    <Insight title="核心判断">把本节最重要的结论压缩成一句话。</Insight>
  </ScrollSection>

  <ScrollSection title="比较候选方案">
    <ScrollGrid columns="2">
      <MatrixModel
        title="影响 / 成本"
        xLabel="成本"
        yLabel="影响"
        cells={[
          {title: '优先投入', description: '高影响、低成本', tone: 'success'},
          {title: '审慎评估', description: '高影响、高成本', tone: 'warn'},
          {title: '快速验证', description: '低影响、低成本'},
          {title: '暂缓处理', description: '低影响、高成本', tone: 'danger'}
        ]}
      />
      <Callout type="info" title="判断方法">先验证高影响、低成本的选项。</Callout>
    </ScrollGrid>
  </ScrollSection>
</ScrollDocument>
```

`ScrollDocument` 支持：

- `spacing="compact|comfortable|airy"`：章节内垂直节奏，默认 `comfortable`。
- `fontSize="compact|normal|large|xlarge"`：正文大小，默认 `normal`。
- `scale` / `lineHeight`：可选的数值覆盖。
- `toc` / `progress`：目录与阅读进度，默认开启；布尔值使用裸 prop 或 `{false}`，不要写 `"false"`。

目录由章节标题自动生成，不要手工搭建。正文采用一条居中阅读柱，左边缘标签悬停或聚焦时展开目录面板。

## 4. 信息密度来自结构，不来自组件数量

信息密度不是减少字数，也不是把页面塞满，而是让每个区块承担不同的认知任务。

| 任务 | 优先组件 |
| --- | --- |
| 建立直觉 | `Overview`、`ScrollProse`、`Example` |
| 给出定义 | `Definition`、`Glossary` |
| 解释机制 | `Mechanism`、`Flow`、`Timeline`、`Mermaid` |
| 比较与决策 | `Compare`、`MatrixModel`、`DecisionMatrix`、`Tradeoff` |
| 压缩结论 | `Insight`、`Callout`、`NoteGrid` |
| 说明限制 | `Boundary`、`Counterexample`、`FailureMode` |
| 保留证据 | `Evidence`、`Invariant`、`Checklist`、`Details` |
| 教学推演 | `WorkedExample`、`Step`、`Quiz`、`KeyTakeaways` |
| 标注来源 | `Source`、`Confidence`、`LastReviewed`、`Cite` / `References` |
| 状态与分支 | `StateMachine`、`DecisionTree`、`FeedbackLoop` |
| 数据与改动 | `DataTable`、`PropertyList`、`Metric`、`Chart`、`CodeDiff` |
| 结构与引用 | `TreeView`、`Columns`、`Stack`、`Grid`、`Quote` |

一个实用的论证节奏是：

```text
问题 → 定义 → 机制 → 证据 → 例子 → 边界 → 结论
```

不要把同一段文字同时放进 `Overview`、`Definition` 和 `Insight`。每个组件都应增加新信息；只有标题或摘要的节点应补充内容或合并掉。密度没有固定配额，不要为了凑数拆段或编造证据。

## 5. 常见语法陷阱

### 数组与对象

数组 prop 的形状互不通用，先查组件参考再写字段。

```mdx
<Flow steps={['输入', '处理', '输出']} />

<Timeline events={[
  {label: '第一阶段', time: '2026-01', content: '完成定义'},
  {label: '第二阶段', content: '完成验证'}
]} />

<DecisionMatrix
  title="方案比较"
  headers={['维度', '方案 A', '方案 B']}
  rows={[['成本', '低', '高'], ['风险', '中', '低']]}
/>
```

`Flow` 接受字符串或对象；`DecisionMatrix.rows` 是二维数组；`LearningObjectives` / `KeyTakeaways` 接受字符串数组。完整形状见组件参考。

### Math

MDX 会把子内容里的 `{}` 当作表达式。含花括号的 LaTeX 必须走 `formula` prop：

```mdx
<Overview>信息量约为 <Math formula="\log_2 N" /> 比特。</Overview>

<MathBlock
  title="香农信息量"
  formula="I(x) = -\log_2 p(x)"
  variables={[{symbol: 'p(x)', description: '事件发生的概率'}]}
/>
```

不含花括号的简单 LaTeX 可以写子内容，但统一使用 `formula` 更稳妥。

### Code

代码作为字符串传入，多行代码使用模板字符串，避免 MDX 解析花括号：

```mdx
<CodeBlock language="bash" title="校验与构建" lineNumbers>{`npx concept-atlas-dense-explain validate topic.mdx --mode atlas
npx concept-atlas-dense-explain topic.mdx --mode atlas`}</CodeBlock>
```

`Implementation` 用于节点内的实现语义；`CodeBlock` 是通用代码块。

### Figure 与引用

```mdx
<Figure
  id="flow"
  src="./assets/diagram.png"
  alt="数据从输入流经处理到输出"
  caption="处理流程"
/>
<Overview>如 <FigureRef id="flow" /> 所示，处理分为三步。</Overview>

<Overview>该结论依赖可追溯的证据<Cite id="tufte1983" />。</Overview>
<References items={[
  {id: 'tufte1983', authors: 'Tufte, E. R.', year: '1983', title: 'The Visual Display of Quantitative Information'}
]} />
```

- 始终提供 `alt`；`id` + `FigureRef` 自动生成图号，不要手写“图 1”。
- 本地图片默认外链；`--inline-assets` 或单图 `inline` 控制内联。外链 `src` 相对输出 HTML 解析，需把 `assets/` 放在 HTML 旁或调整路径。
- `atlas` 中把 `Cite` 和 `References` 放在同一个节点，避免未打开节点的引用无法解析。

### 布尔值与静默 prop

布尔值使用裸 prop 或 `{true}` / `{false}`：

```mdx
<ScrollDocument toc={false} progress>
  ...
</ScrollDocument>
```

不要写 `toc="false"` 或 `showValues="false"`；这些运行时布尔值会把字符串当作真。资源插件也能识别 `inline="false"`，但统一使用 `inline={false}` 更清楚。未知 prop 目前会被静默忽略，因此必须查组件参考，不能凭印象猜。

## 6. 阅读与交互

- Atlas 支持祖先路径、父子导航、子概念卡片和全局关系图。
- Scroll 自动生成目录与阅读进度，正文保持居中阅读柱。
- 图片和 Mermaid 图支持全屏放大、拖拽平移、滚轮缩放和 `Esc` 关闭；双击在 1x / 2x 间切换，`0` 重置。
- Atlas 画布支持拖动平移、滚轮缩放、`Esc` 返回父节点；`1` / `E` 进入概念探索，`2` / `G` 进入知识网络，`T` 切换主题。
- 外观由读者切换，内容 MDX 不设置皮肤、主题或组件风格。

## 7. 校验与完整参考

CLI 会检查外壳、节点 id、父子关系、引用、关系端点、数组形状和资源路径。错误阻止构建；警告表示结构或可读性仍有改进空间。

完整诊断分类与修复动作见 [`references/diagnostics.md`](../skills/concept-atlas-dense-explain/references/diagnostics.md)，完整组件 API 见 [`references/components.md`](../skills/concept-atlas-dense-explain/references/components.md)。
