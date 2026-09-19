# Concept Atlas 框架使用指南

Concept Atlas 的工作方式很简单：内容作者用 MDX 描述知识，渲染器负责把这些语义编译成一个可以离线打开的 HTML 页面。

它的重点不是把文章拆成很多漂亮卡片，而是用合适的结构压缩更多可理解、可验证的信息。

## 1. 最短工作流

如果你还没有 MDX 文件，可以先生成起稿：

```bash
npx concept-atlas-dense-explain create topic.mdx --mode atlas
```

让 AI 活得轻松一点：先取一份可编译的组件参考并阅读，再动手写。

```bash
npx concept-atlas-dense-explain guide --mode atlas -o atlas-guide.mdx
npx concept-atlas-dense-explain guide --mode scroll -o scroll-guide.mdx
```

guide 是一份真实的 MDX，覆盖全部组件和 prop 写法，可以直接编译预览，也可以当模板改写。

改完内容后先校验，再编译：

```bash
npx concept-atlas-dense-explain validate topic.mdx --mode atlas
npx concept-atlas-dense-explain topic.mdx
```

默认输出同目录的 `topic.html`。也可以指定模式和输出路径：

```bash
npx concept-atlas-dense-explain article.mdx --mode scroll
npx concept-atlas-dense-explain article.mdx -o public/article.html --force
```

CLI 不会初始化项目，不会复制 MDX，也不会要求用户维护 `package.json`、`src/` 或 Vite 配置。

## 2. 先选页面外壳

`atlas` 和 `scroll` 不是两套组件库，而是两种页面外壳。

| 外壳 | 适合的问题 | 必要结构 |
| --- | --- | --- |
| `atlas` | 概念有层级，需要下钻、回溯和关系图 | `ExplainPage`、`ConceptGraph`、`ConceptNode` |
| `scroll` | 内容按章节连续阅读，重点是论证、比较和总结 | `ScrollDocument`、`ScrollSection`、`ScrollProse` |

共享的信息组件可以放进合适的位置。比如 `Insight`、`Flow`、`Mermaid`、`Callout`、`FrameworkModel`、`MatrixModel`、`FormulaModel`、`DecisionMatrix`、`FailureMode`、`NoteGrid`、`Tabs` 和 `Details` 并不属于某个外壳。扩展组件 `Math`/`MathBlock`、`Chart`、`Figure`、`Cite`/`References` 同样两种外壳通用。

外壳决定页面如何组织，组件决定一段信息如何被理解。

## 3. Atlas 写法

Atlas 用概念树承载导航，用 `Relation` 表达不属于树结构的关系：

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
      <Overview>先解释全局过程和读者需要建立的直觉。</Overview>
      <Definition>给出准确的定义和边界。</Definition>
      <Flow title="处理阶段" steps={[
        {title: '构造', description: '确定方法、目标和请求头'},
        {title: '传输', description: '通过连接发送请求消息'},
        {title: '处理', description: '服务端校验、执行业务逻辑'},
        {title: '响应', description: '返回状态、头部和消息体'}
      ]} />
      <Children><ConceptRef id="request-line" /></Children>
    </ConceptNode>

    <ConceptNode id="request-line" title="请求行" level="L1" parent="request">
      <Definition>请求行声明方法、目标资源和协议版本。</Definition>
      <Example title="典型请求">GET /users HTTP/1.1</Example>
    </ConceptNode>

    <Relation from="request-line" to="request" type="implements" label="具体化" />
  </ConceptGraph>
</ExplainPage>
```

层级建议：`L0` 是全局主题，`L1` 是主要分支，`L2` 是局部机制，`L3` 是实现细节，`L4` 是边界、反例或异常情况。

节点还可以用可选的 `kind` 单独标注知识角色，它与层级正交，用于知识网络页的按类型筛选：

```text
system     整体系统、产品或问题域      stage      生命周期阶段或子系统
mechanism  可验证的工作机制           artifact   阶段产出的实体或文件
failure    失败模式与异常             tool       工具、库或外部依赖
boundary   约束、前提与非目标         decision   设计取舍与选择点
```

声明 `kind="mechanism"` 的节点建议至少包含一个 `Invariant` 或 `Evidence`；声明 `kind="failure"` 的节点建议包含 `FailureMode`。这两条契约只在主动写出 `kind` 后生效，`--strict` 会把它升级为错误。

## 4. Scroll 写法

Scroll 用章节组织阅读顺序。共享组件放在章节中，不需要为了使用 `Flow` 或 `MatrixModel` 改成 Atlas：

```mdx
<ScrollDocument>
  <ScrollHeader title="如何做一次技术判断">
    先说明问题、背景和读者最终要带走的判断。
  </ScrollHeader>

  <ScrollSection title="先定义问题">
    <ScrollProse>解释问题的范围、输入和关键约束。</ScrollProse>
    <Insight title="核心判断">把本节最重要的结论压缩成一句话。</Insight>
  </ScrollSection>

  <ScrollSection title="比较候选方案">
    <ScrollGrid columns="2">
      <MatrixModel title="影响 / 成本" xLabel="成本" yLabel="影响" cells={[
        {title: '优先投入', description: '高影响、低成本', tone: 'success'},
        {title: '谨慎评估', description: '高影响、高成本', tone: 'warn'},
        {title: '暂缓处理', description: '低影响、高成本', tone: 'danger'}
      ]} />
      <Callout type="info" title="判断方法">先验证高影响、低成本的选项。</Callout>
    </ScrollGrid>
  </ScrollSection>
</ScrollDocument>
```

`ScrollDocument` 的 `spacing` 控制章节内部的垂直节奏，默认是 `comfortable`：

```mdx
<ScrollDocument spacing="compact">
  ...
</ScrollDocument>

<ScrollSection title="需要展开的章节" spacing="airy">
  ...
</ScrollSection>
```

可选值：

- `compact`：组件较多、希望一屏承载更多信息。
- `comfortable`：默认值，适合普通技术文章。
- `airy`：段落较少、希望突出章节分隔。

配置会统一控制章节内组件之间的间距和 `ScrollGrid` 的列间距；组件不需要自己添加布局样式。

## 5. 如何提升信息密度

信息密度不是减少字数，而是让每个区块承担清晰的认知任务：

| 任务 | 优先组件 |
| --- | --- |
| 建立直觉 | `Overview`、`ScrollProse`、`Example` |
| 给出严格定义 | `Definition`、`Glossary` |
| 解释过程 | `Mechanism`、`Flow`、`Timeline`、`Mermaid` |
| 比较和决策 | `Compare`、`MatrixModel`、`DecisionMatrix`、`Tradeoff` |
| 压缩结论 | `Insight`、`Callout`、`NoteGrid` |
| 说明限制 | `Boundary`、`Counterexample`、`FailureMode` |
| 保留证据 | `Evidence`、`Invariant`、`Details` |

推荐一个基本节奏：

```text
问题 → 定义 → 机制 → 证据 → 例子 → 边界 → 结论
```

不要把同一段文字同时放进 `Overview`、`Definition` 和 `Insight`。每个组件应该补充新的信息，而不是换一种样式重复内容。

## 6. 交给 AI 的写作要求

可以直接把下面的要求交给 AI：

```text
请把这份材料改写成 Concept Atlas MDX。

1. 先判断使用 atlas 还是 scroll；不要改变已经选定的页面外壳。
2. 只使用框架提供的语义组件，不写 CSS、手工 SVG 或页面布局代码。
3. 每个重要概念都要有 claim-like 标题、一句话 summary，以及定义、机制、例子或边界中的合适内容。
4. 过程用 Flow / Timeline / Mermaid，比较用 MatrixModel / DecisionMatrix，结论用 Insight，限制用 Boundary 或 FailureMode。
5. 让每个组件承担不同的信息任务，优先提升可验证性和信息密度。
6. 检查所有 id、parent、ConceptRef 和 Relation 的引用是否一致。
7. 最后给出编译命令：npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll
```

## 7. 数据类型速查

MDX 属性使用 JavaScript 表达式。字符串要加引号，数组和对象要用 `{}` 包起来；对象数组中的字段名必须与组件约定一致。

```mdx
<Flow steps={[
  '先收集输入',
  {title: '处理', description: '说明这一阶段发生什么'},
  {title: '输出', description: '说明结果和证据'}
]} />

<Timeline events={[
  {label: '阶段一', content: '发生了什么'},
  {time: '阶段二', desc: '接下来发生什么'}
]} />

<DecisionMatrix
  title="方案比较"
  headers={['维度', '方案 A', '方案 B']}
  rows={[['成本', '低', '高'], ['风险', '中', '低']]}
/>

<FrameworkModel
  title="关键要素"
  type="elements"
  elements={[{title: '输入', description: '来源和约束'}]}
/>

<FormulaModel
  title="计算关系"
  formula="结果 = 输入 × 系数"
  variables={[{symbol: '输入', description: '变量含义'}]}
/>

<NoteGrid notes={[{title: '标签', content: '短结论'}]} />
<Tabs items={[{label: '视角一', content: '对应内容'}]} />
```

常用属性类型如下：

| 组件 | 属性 | 类型 |
| --- | --- | --- |
| `ConceptNode` | `kind` | `'system' \| 'stage' \| 'mechanism' \| 'artifact' \| 'failure' \| 'tool' \| 'boundary' \| 'decision'`（可选，与 `level` 正交） |
| `Flow` | `steps` | `string[]` 或 `{ title?: string, label?: string, description?: string }[]` |
| `Timeline` | `events` | `{ label?: string, time?: string, content?: string, desc?: string }[]` |
| `DecisionMatrix` | `headers` / `rows` | `string[]` / `string[][]` |
| `Compare` | `items` | `{ label?: string, title?: string, rows?: string[], values?: string[] }[]` |
| `FrameworkModel` | `type` | `'elements' | 'stages' | 'layers' | 'cycle'` |
| `FrameworkModel` | `elements` | `{ title?: string, label?: string, name?: string, description?: string }[]` |
| `MatrixModel` | `cells` | `{ title?: string, label?: string, description?: string, tone?: string }[]` |
| `FormulaModel` | `variables` | `{ symbol?: string, name?: string, description?: string, value?: string }[]` |
| `Tradeoff` | `options` | `{ name?: string, label?: string, benefit?: string, cost?: string, when?: string }[]` |
| `NoteGrid` | `notes` | `{ title?: string, label?: string, content?: string, text?: string, description?: string }[]` |
| `Mermaid` | `chart` | `string`，使用模板字符串表达多行图表 |
| `Tabs` | `items` | `{ label?: string, title?: string, content?: string }[]` |
| `Math` | `formula` | `string`（LaTeX；含 `{` 或反斜杠时用这个 prop，不要写子内容） |
| `MathBlock` | `formula` / `variables` | `string` / `{ symbol?: string, name?: string, description?: string }[]` |
| `Chart` | `type` / `data` / `series` / `labels` | `'bar' \| 'line' \| 'pie'` / `{ label?: string, value: number }[]` / `{ name?: string, values: number[] }[]` / `string[]` |
| `Figure` | `src` / `alt` / `caption` / `label` | `string`（相对路径构建时内联）/ `string` / `string` / `string` |
| `References` | `items` | `{ id: string, authors?: string, year?: string, title?: string, url?: string, source?: string, note?: string }[]` |

组件也支持 JSX 子内容作为备用写法，例如 `<Flow>...</Flow>`、`<DecisionMatrix>...</DecisionMatrix>`。但带数据属性的写法更适合让 AI 稳定生成和检查。

## 8. 常见错误

- 把 `atlas` 和 `scroll` 当成两套组件库，导致不敢在章节或节点中使用共享组件。
- Atlas 节点缺少 `id`、`level` 或错误的 `parent`，导致树无法正确导航。
- `ConceptRef` 指向不存在的节点，或者 `Relation` 的 `from` / `to` 拼写不一致。
- 一个组件里塞入过长的散文，既没有结构，也没有可验证证据。
- 在 MDX 中直接写 CSS、坐标或自定义页面框架，破坏语义层和响应式布局。
- 输出文件已经存在却没有使用 `--force`，CLI 会主动拒绝覆盖。

## 9. 组件速查

完整组件实现位于 `packages/concept-atlas-dense-explain/template/src/components/MDXComponents.jsx`。常用组件包括：

```text
页面外壳：ExplainPage、ConceptGraph、ConceptNode、ScrollDocument、ScrollSection
知识语义：Overview、Definition、Mechanism、Prerequisite、Input、Output、Boundary
论证证据：Example、Counterexample、Evidence、Invariant、FailureMode、Tradeoff
信息模型：Flow、Timeline、Compare、DecisionMatrix、FrameworkModel、MatrixModel
阅读组件：Insight、Callout、Details、NoteGrid、Tabs、Columns、Stack、Grid、Split
图形组件：Mermaid、RelationMap、RelationPath
扩展能力：Math、MathBlock、Chart、Figure、Cite、References
```

组件的选择应服从内容关系，不应服从视觉装饰。页面的价值来自结构化表达，而不是组件数量。

## 10. 扩展组件

### 数学公式

`Math` 用于行内符号，`MathBlock` 用于独立公式。因为 MDX 会把子内容里的 `{}` 当作表达式，凡公式含 `{` 或反斜杠，一律用 `formula` prop：

```mdx
<Overview>信息量约为 <Math formula="\log_2 N" /> 比特。</Overview>

<MathBlock
  title="香农信息量"
  formula="I(x) = -\log_2 p(x)"
  variables={[{symbol:'p(x)',description:'事件发生的概率'}]}
/>
```

只有不含大括号的简单 LaTeX 才能写子内容，例如 `<Math>\log_2 N</Math>`。

### 数据图表

`Chart` 支持 `bar`、`line`、`pie`，颜色跟随主题：

```mdx
<Chart title="各阶段耗时" type="bar" unit="小时" data={[{label:'收集',value:6},{label:'分析',value:14}]} />
<Chart title="留存趋势" type="line" labels={['第1周','第2周']} series={[{name:'留存率',values:[100,72]}]} />
```

### 图片与题注

`Figure` 把图片和题注绑定。相对路径的图片会在构建时转成 base64 内联，保证单文件离线可用；远程 URL 保持外链：

```mdx
<Figure src="./assets/diagram.png" alt="架构示意" label="图 1" caption="数据从输入流经处理到输出。" />
```

点击图片会在全屏浮层中放大查看：滚轮或 `+` / `−` 缩放，拖拽平移，双击在 1x / 2x 间切换，`0` 重置，`Esc` 或点击背景关闭。图片本身是键盘可达的按钮，回车即可打开。浮层通过 portal 挂到 `body`，因此不受草稿画布缩放或卡片旋转的影响。

找不到本地图片只会产生 warning 并显示占位符，不会中断构建。

`--link-assets` 会关闭 base64 内联，让图片保持相对链接，页面不再自包含但体积显著下降（同一目标 1.51MB → 270KB）。此时 HTML 必须与 MDX 的 `assets/` 保持相对位置，否则 CLI 会警告。

### 引用与文献

`Cite` 的 `id` 对应 `References` 中条目的 `id`，编号自动取该条目在列表中的序号：

```mdx
<Overview>该结论依赖可追溯的证据<Cite id="tufte1983" />。</Overview>
<References items={[{id:'tufte1983',authors:'Tufte, E. R.',year:'1983',title:'The Visual Display of Quantitative Information',source:'Graphics Press'}]} />
```

在 `atlas` 中，节点内容只在打开该节点时渲染，因此请把 `Cite` 和对应的 `References` 放在同一个节点内。

## 11. 可配置排版与阅读体验

`ScrollDocument` 会自动根据章节标题生成侧栏目录和阅读进度，并用 `fontSize` 控制正文大小：

```mdx
<ScrollDocument spacing="comfortable" fontSize="large" toc progress>
  ...
</ScrollDocument>
```

- `fontSize`：`compact | normal | large | xlarge`。
- 也可以传数值 `scale`（字号倍率）和 `lineHeight` 覆盖预设。
- `toc` / `progress`：分别控制目录与阅读进度条，默认开启。
- `ScrollSection` 可以用 `id` 指定锚点，否则由标题自动生成。

不要为了调整字号在内容里写 CSS，统一通过这两个 prop 控制。

## 12. 内容校验

CLI 在构建前会静态校验内容结构。错误会阻止构建，警告只提示：

```bash
npx concept-atlas-dense-explain validate topic.mdx           # 人类可读
npx concept-atlas-dense-explain validate topic.mdx --json    # 机器可读
npx concept-atlas-dense-explain validate topic.mdx --strict  # 把结构警告升级为错误
```

常见错误码：

| 错误码 | 含义 |
| --- | --- |
| `UNKNOWN_COMPONENT` | 组件名拼错或未导出 |
| `CARRIER_MISSING` / `CARRIER_CONFLICT` / `CARRIER_MODE_MISMATCH` | 外壳缺失、同时存在两种外壳，或与 `--mode` 不一致 |
| `NODE_MISSING_ID` / `NODE_MISSING_TITLE` / `DUPLICATE_NODE_ID` | 节点缺少 id/title 或 id 重复 |
| `MISSING_PARENT` / `GRAPH_ROOT_UNRESOLVED` | parent 或 ConceptGraph root 指向不存在的节点 |
| `REF_UNRESOLVED` / `RELATION_FROM_UNRESOLVED` / `RELATION_TO_UNRESOLVED` | ConceptRef 或 Relation 端点断链 |

常见警告：`NODE_MISSING_SUMMARY`、`NODE_NO_CORE_CONTENT`、`UNKNOWN_LEVEL`、`UNKNOWN_RELATION_TYPE`、`RELATION_MISSING_LABEL`、`PROP_EXPECTS_ARRAY`、`MATH_CHILDREN_BRACES`、`GRAPH_MISSING_ROOT`、`ASSET_MISSING`。

确实需要跳过校验时使用 `--no-validate`，但应视为例外。
