# Concept Atlas 使用指南

Concept Atlas 是一个基于 React + MDX 的知识讲解画布。MDX 负责描述“知识是什么、节点之间有什么关系、笔记应该包含哪些组件”，应用负责把这些内容渲染成可缩放的概念草稿、层级导航和关系图。

## 1. 启动与构建

```bash
npm install
npm run dev
```

开发服务启动后，用浏览器打开终端显示的地址。

生成离线单文件产物：

```bash
npm run build
```

构建结果位于 `dist/index.html`，JS 和 CSS 会被内联，可以直接分发。

## 2. 内容入口

默认内容位于：

```text
content/compile-runtime.mdx
```

`src/main.jsx` 当前会加载这篇 MDX：

```jsx
import CompileRuntimeDoc from '../content/compile-runtime.mdx';

<App mdxContent={<CompileRuntimeDoc components={Components} />} />
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
src/model/concept-schema.js        # 概念树与关系图模型
src/views/NodeExplorer.jsx         # 概念探索画布
src/views/RelationGraph.jsx        # 层级图 / 概念关系图
src/styles/concept-explain.css     # 全局和组件样式
content/*.mdx                      # 知识内容
```

新增组件时，记得在 `src/components/index.js` 中导出，使 MDX 可以使用。
