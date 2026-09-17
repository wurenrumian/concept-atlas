# Concept Atlas 使用指南

Concept Atlas 是一个基于 React + MDX 的知识讲解画布。MDX 负责描述“知识是什么、节点之间有什么关系、笔记应该包含哪些组件”，应用负责把这些内容渲染成可缩放的概念草稿、层级导航和关系图。

## 1. 生成与构建

Concept Atlas 的 CLI 直接编译单个 MDX 文件，不需要初始化项目或复制模板：

```bash
npx concept-atlas-dense-explain create topic.mdx --mode atlas
# 先取一份可编译的组件参考，学习全部组件与 prop
npx concept-atlas-dense-explain guide --mode atlas -o atlas-guide.mdx
# 用 AI 改写 topic.mdx 后，先校验再编译：
npx concept-atlas-dense-explain validate topic.mdx
npx concept-atlas-dense-explain topic.mdx
```

连续阅读载体使用：

```bash
npx concept-atlas-dense-explain create article.mdx --mode scroll
npx concept-atlas-dense-explain guide --mode scroll -o scroll-guide.mdx
npx concept-atlas-dense-explain article.mdx --mode scroll -o dist/article.html
```

默认输出为输入文件同目录下的同名 `.html`；已有输出需要显式添加 `--force` 才会覆盖。`validate` 支持 `--json` 和 `--strict`，校验未通过时会阻止构建，可用 `--no-validate` 跳过。

### 批量编译

一次传入多个 MDX 可以在同一进程内并行构建，省去每个目标重复启动 CLI 与 Vite 的开销。此时 `-o` 是输出目录：

```bash
npx concept-atlas-dense-explain papers/a.mdx papers/b.mdx papers/c.mdx -o dist --force
# 默认并发 2；单次构建峰值内存约 1–2GB，建议不超过 3
npx concept-atlas-dense-explain papers/*.mdx -o dist --concurrency 3
```

批量语义：**先整体校验，再整体构建**。任意一个文件存在 `error` 时不会开始构建（`--no-validate` 可跳过）；`--json` 在批量模式下输出数组，每项带 `file` 字段。

### 按需裁剪渲染器

构建会扫描内容，只把真正用到的重型渲染器打进产物：

- 没有 `<Math>` / `<MathBlock>` 时，KaTeX 及其样式（约 1.4MB 内联字体）不会进入产物。
- 没有 `<Mermaid>` 时，Mermaid 不会进入产物。

构建结束会打印汇总，例如 `(KaTeX dropped on 3/3)`。一篇不使用公式和图表的 `scroll` 文章通常是约 250KB 而不是约 5MB。如果确实需要某个渲染器，正常写组件即可，无需任何开关。

### 图片内联与 `--link-assets`

默认（不传开关）会把 `Figure` 的相对路径图片读成 base64 内联进 HTML，产物单文件、离线可开，代价是每张截图都会让 HTML 变大。传入 `--link-assets` 后图片保持相对链接：

```bash
# 输出与 assets/ 同目录时，相对路径可直接解析
npx concept-atlas-dense-explain paper.mdx --link-assets
```

实测同一个目标：内联 1.51MB → 链接 270KB。代价是页面不再自包含，`<html>` 必须和 MDX 的 `assets/` 保持相对位置；如果 `-o` 指到别处，CLI 会打印警告，此时需要自行拷贝 `assets/`。

### 外观系统与编译期默认值

每个产物页面右上有外观菜单（调色板图标），读者可随时切换三件事：

- **配色皮肤**：`aurora`（冷调蓝紫）或 `ember`（暖调金赤陶），两者都有暗色/亮色两套色板；
- **明暗模式**：暗色 / 亮色一键切换；
- **组件风格**：`manuscript`（手稿排版：索引戳记记录卡、双规线图版、页边注示例）或 `classic`（经典卡片）。

选择保存在 localStorage，atlas 与 scroll 两个载体共享。发货默认外观为 **aurora × manuscript × 亮色**。

需要不同的默认外观时，可在编译期烘焙（读者仍可切换）：

```bash
# CLI 参数
npx concept-atlas-dense-explain paper.mdx --skin ember --default-mode dark --style classic

# 仓库自身构建可用环境变量
CONCEPT_ATLAS_SKIN=ember CONCEPT_ATLAS_DEFAULT_MODE=dark CONCEPT_ATLAS_STYLE=classic npm run build
```

默认外观在构建时写进防闪烁脚本，首屏渲染前即生效，不会闪白/闪黑。内容 MDX 不涉及外观——外观属于载体与工具层，内容层不要设置。

仓库自身仍可以使用以下命令进行开发：

```bash
npm install
npm run dev
npm test          # 校验器单元测试 + 渲染冒烟测试
npm run validate  # 校验 content/*.mdx
npm run sync      # 把 src/ 同步到 npm 包模板（check:sync 只检查）
```

开发服务启动后，用浏览器打开终端显示的地址。

生成离线单文件产物：

```bash
npm run build
```

构建会生成两个可直接分发的单文件入口，JS 和 CSS 均内联：

- `dist/index.html`：概念探索与关系图。
- `dist/scroll.html`：传统连续阅读示例，使用同一套语义组件但不依赖概念图谱框架。

`atlas` 和 `scroll` 是渲染载体，不是两种项目模板。CLI 会根据顶层组件自动识别载体；也可以通过 `--mode` 明确指定。

浏览器标签页标题取自 MDX 外壳：`atlas` 用 `<ExplainPage title="...">`，`scroll` 用 `<ScrollHeader title="...">`；未声明时保留载体默认标题。所有产物页面的标签页图标固定为 📃 文档 emoji。

## 2. 内容入口

默认展示内容位于：

```text
content/components-demo.mdx
```

这是一篇专门的组件展厅，集中展示完整组件族。原有的编译与运行示例仍保留在 `content/compile-runtime.mdx`，可作为内容型页面参考。

连续阅读是另一种内容载体，示例位于 `content/scroll-reading-demo.mdx`。它使用 `ScrollDocument`、`ScrollHeader`、`ScrollSection`、`ScrollProse` 和 `ScrollGrid` 作为文档外壳；`Flow`、`Insight`、`MatrixModel`、`Mermaid`、`Callout` 等信息组件与 Atlas 共用。两种外壳应在写作前选择其一，不要把同一份 MDX 同时写成两套顶层结构。模板同时附带两篇示例仅供参考；实际使用时直接维护自己的 MDX 文件。

`src/main.jsx` 当前会加载组件展厅：

```jsx
import ComponentsDemoDoc from '../content/components-demo.mdx';

<App mdxContent={<ComponentsDemoDoc components={Components} />} />
```

如果要接入另一篇文档，替换这里的 MDX 导入即可。MDX 中使用的组件需要从 `src/components/index.js` 导出。

## 3. 最小知识模型

一篇文档由 `ExplainPage`、`ConceptGraph`、`ConceptNode` 和 `Relation` 组成：

```mdx
<ExplainPage
  id="http-request"
  title="HTTP 请求"
  summary="客户端通过请求消息与服务端交换资源。"
>
  <ConceptGraph root="http-root">
    <ConceptNode
      id="http-root"
      title="HTTP 请求"
      level="L0"
      parent={null}
      summary="一次请求包含方法、目标、头部和可选消息体。"
    >
      <Overview>HTTP 请求是客户端发往服务端的结构化消息。</Overview>
      <Children>
        <ConceptRef id="request-line" />
      </Children>
    </ConceptNode>

    <ConceptNode
      id="request-line"
      title="请求行"
      level="L1"
      parent="http-root"
    >
      <Definition>请求行声明方法、目标资源和协议版本。</Definition>
    </ConceptNode>

    <Relation
      from="request-line"
      to="http-root"
      type="implements"
      label="具体化"
      description="请求行是请求消息的具体组成部分。"
    />
  </ConceptGraph>
</ExplainPage>
```

### 树关系

树关系由两个字段共同决定：

- `ConceptGraph root="..."`：指定根节点。
- `ConceptNode parent="..."`：指定父节点。

`Children` / `ConceptRef` 用来声明下钻入口。即使只写 `parent`，引擎也会自动补齐父节点的子节点列表；推荐同时写 `Children`，这样内容结构更直观。

节点层级建议使用：

| 层级 | 用途 |
| --- | --- |
| `L0` | 全局主题 |
| `L1` | 主要阶段或子系统 |
| `L2` | 局部机制 |
| `L3` | 实现细节 |
| `L4` | 边界、反例和异常情况 |

### 概念关系

`Relation` 不改变树结构，只表示跨节点关系。常用类型包括：

```text
prerequisite  前置知识
produces      产出生成
uses          消费使用
implements    实现关系
precedes      时序先后
depends-on    依赖关系
contrasts     对比关系
exception-of  异常或反例
```

例如：

```mdx
<Relation
  from="lexer"
  to="ast"
  type="produces"
  label="生成"
  description="词法和语法分析共同为 AST 提供输入。"
/>
```

节点探索页使用这些关系生成中央笔记中的关系说明；知识网络页可以在“层级结构”和“概念关系”之间切换。

## 4. 节点内容组件

以下组件适合放在 `ConceptNode` 内部：

```mdx
<Overview>快速建立整体认知。</Overview>
<Definition>给出严格定义。</Definition>
<Mechanism>解释状态如何流动或机制如何工作。</Mechanism>
<Prerequisite>需要先理解的知识。</Prerequisite>
<Boundary>适用范围、限制和反例。</Boundary>
<Implementation language="cpp" title="核心代码">
{`int main() { return 0; }`}
</Implementation>
<Example title="典型示例">具体案例。</Example>
<Counterexample title="常见误区">容易混淆的情况。</Counterexample>
<Glossary term="AST">抽象语法树。</Glossary>
```

这些内容会进入当前节点的笔记画布，且会根据节点是否存在对应内容自动显示。

## 5. 高密度展示组件

组件不是只能生成固定卡片。可以使用短文本、表格、流程、时间线和关系组件组合成一张高密度知识草稿。

### Mermaid 图

`Mermaid` 支持 Mermaid 的流程图、时序图、状态图等语法，图表在浏览器中渲染：

```mdx
<Mermaid
  title="请求处理流程"
  width="560px"
  height="220px"
  chart={`flowchart LR
  A[客户端] --> B[路由]
  B --> C[控制器]
  C --> D[服务层]
  D --> E[响应]
  style A fill:#172554,stroke:#38bdf8,color:#e0f2fe`}
/>
```

建议：一张 Mermaid 图只表达一个局部问题；复杂主题拆成多个图，避免图本身成为新的噪音。

### 关系速览

适合把一组关系压缩成表格式摘要：

```mdx
<RelationMap
  title="关键依赖"
  items={[
    { from: 'Parser', type: 'produces', to: 'AST', note: '输出结构化语法树' },
    { from: 'Optimizer', type: 'uses', to: 'IR', note: '在中间表示上优化' },
  ]}
/>
```

### 关键判断

`Insight` 适合 AI 输出结论、辨析或决策提醒：

```mdx
<Insight title="关键判断" tone="info">
  编译不是一次翻译，而是多个约束逐步收敛的过程。
</Insight>

<Insight title="容易出错" tone="warn">
  不要把编译期保证误认为运行期一定成立。
</Insight>
```

`tone` 支持 `info`、`warn`、`success`。

### 便签网格

`NoteGrid` 适合集中放置输入、输出、约束、指标或短结论：

```mdx
<NoteGrid
  notes={[
    { title: '输入', content: '源码和编译选项' },
    { title: '中间态', content: 'AST / IR / SSA' },
    { title: '输出', content: '目标文件' },
  ]}
/>
```

项目还提供 `Compare`、`DecisionMatrix`、`Flow`、`Timeline`、`Callout`、`Details` 和 `Columns`，可以按内容需要组合使用。

### 经典结构模型

对于结构化思考内容，优先用模型组件表达“关键元素”和“组织方式”，避免把相似内容重复写成多个普通卡片：

```mdx
<MatrixModel title="重要/紧急矩阵" xLabel="紧急程度" yLabel="重要程度" cells={[
  { title: '优先处理', description: '重要且紧急', tone: 'danger' },
  { title: '计划安排', description: '重要但不紧急', tone: 'success' },
  { title: '授权处理', description: '不重要但紧急', tone: 'warn' },
  { title: '减少投入', description: '不重要且不紧急' },
]} />
<FormulaModel title="业绩公式" formula="业绩 = 人数 × 人均产出" variables={[
  { symbol: '人数', description: '有效销售人员数量' },
  { symbol: '人均产出', description: '单人平均成交贡献' },
]} />
<PyramidModel title="从基础到结论" levels={[
  { title: '事实', description: '可观察证据' },
  { title: '归纳', description: '共同模式' },
  { title: '结论', description: '可执行判断' },
]} />
```

`FrameworkModel` 适合一分为几、多因素并列、阶段、层级和循环；`FunnelModel` 适合 AIDA、销售转化和筛选收敛。`Flow`、`DecisionMatrix` 等旧组件仍然兼容。

### 公式、图表、配图与引用

扩展组件让正文可以带上推导、数据和出处：

```mdx
{/* 行内公式；含大括号或反斜杠时用 formula prop */}
<Overview>信息量为 <Math formula="\log_2 N" /> 比特。</Overview>
<MathBlock title="复利" formula="V_t = V_0 \cdot (1 + r)^t" variables={[{symbol:'r',description:'增长率'}]} />

{/* 图表：bar / line / pie */}
<Chart title="各阶段耗时" type="bar" data={[{label:'收集',value:6},{label:'分析',value:14}]} />

{/* 配图：相对路径在构建时内联为 base64 */}
<Figure src="./assets/diagram.svg" alt="示意" label="图 1" caption="从输入到输出。" />

{/* 引用与文献：Cite 的 id 对应 References 条目的 id */}
<ScrollProse>结论依赖可追溯证据<Cite id="tufte1983" />。</ScrollProse>
<References items={[{id:'tufte1983',authors:'Tufte, E. R.',year:'1983',title:'The Visual Display of Quantitative Information'}]} />
```

`Math` 的子内容里出现 `{}` 会被 MDX 当成表达式，因此含花括号的 LaTeX 必须走 `formula` prop。找不到的本地图片只会产生 warning 并显示占位符。`Figure` / `Image` 的图片可以点击放大：滚轮或 `+` / `−` 缩放，拖拽平移，双击切换 1x / 2x，`0` 重置，`Esc` 或点击背景关闭。

## 6. 组件尺寸与自由排布

高密度组件默认按实际内容收缩，不会自动撑满整列。需要控制布局时，可以传入尺寸和位置：

```mdx
<Insight
  title="局部结论"
  width="280px"
  height="120px"
  position="absolute"
  x={720}
  y={260}
>
  这个组件会被放在画布的指定坐标。
</Insight>
```

参数含义：

- `width`：宽度，例如 `280px`、`40%`。
- `height`：高度，例如 `120px`。
- `x` / `y`：画布坐标，单位为像素。
- `position="absolute"`：脱离文档流，自由放置。
- 不传 `position`：按普通笔记流排列。

自由排布适合 Mermaid 图、关系总览和关键结论；长篇解释、代码和定义建议继续使用普通流式布局。

## 7. 探索与导航

探索页提供三种导航方式：

1. 左侧祖先路径：点击任意祖先节点返回上层。
2. 层级导航条：当前节点下方显示父级入口和子节点入口。
3. 子概念卡片：在“深入下钻”区域点击进入子节点。

画布操作：

- 鼠标拖动：平移画布。
- 鼠标滚轮：缩放画布。
- 右下角工具组：放大、缩小、重置和进入全局关系图。
- `Esc`：返回父节点。
- `1` / `E`：概念探索。
- `2` / `G`：知识网络。
- `T`：切换主题。

## 8. 写作建议

适合交给 AI 的写作边界：

- 一个 `ConceptNode` 只表达一个可以被命名的概念。
- `Overview` 负责建立直觉，`Definition` 负责精确定义，`Mechanism` 负责解释过程。
- 跨节点的关系写成 `Relation`，不要把所有内容塞进一段文字。
- 用 `Insight` 写结论，用 `Boundary` 写限制，用 `Counterexample` 写反例。
- 一个组件只承担一种信息组织方式；复杂页面拆成多个小组件。
- 自由布局组件先确定坐标区域，再给出宽高，避免彼此覆盖。

## 9. 目录与扩展位置

```text
src/components/MDXComponents.jsx   # MDX 组件实现
src/model/normalize-content.js     # MDX 语义提取
src/model/validate-content.js      # 内容校验器（浏览器与 CLI 共用）
src/model/citations.js             # Cite/References 引用编号
src/model/concept-schema.js        # 概念树与关系图模型
src/views/NodeExplorer.jsx         # 概念探索画布
src/views/RelationGraph.jsx        # 层级图 / 概念关系图
src/styles/concept-explain.css     # 全局和组件样式
content/*.mdx                      # 知识内容
test/*.test.mjs                    # 校验器测试
scripts/sync-template.mjs          # src/ 同步到 npm 包模板
```

`src/` 是唯一真相源，npm 包内的 `template/` 由 `npm run sync` 生成；提交前可用 `npm run check:sync` 确认没有漂移。

新增组件时，记得在 `src/components/index.js` 中导出，并把组件名加入 `src/model/validate-content.js` 的 `KNOWN_COMPONENTS`，使 MDX 可以使用且通过校验。
