# 开发需求：基于 MDX 的概念缩放式知识讲解模板

## 1. 项目目标

开发一个真正可复用的“概念缩放式知识讲解模板”。

它不是一个静态 HTML 示例，也不是把 Markdown 简单包装成卡片，而是一套完整的
内容渲染系统：

AI 生成 MDX
→ 解析 MDX 内容与语义关系
→ 构建概念节点树和关系图模型
→ 使用统一模板渲染
→ 生成可交互的知识讲解网页

系统用于解释：

- 编程和计算机科学
- 软件架构
- 算法和数据结构
- 数学和物理
- 历史和社会科学
- 经济学
- 其他具有层级、机制、因果或关系网络的复杂知识

核心目标：

> 让 AI 只负责描述知识内容和概念关系，模板负责所有页面结构、视觉样式、交互
> 逻辑和关系图呈现。

———

# 2. 最重要的职责边界

## MDX 的职责

MDX 只负责：

知识内容
概念节点
节点层级
父子关系
语义关系
代码
公式
示例
边界
反例

MDX 不负责：

CSS
HTML 页面布局
三栏结构
节点卡片样式
关系图绘制
页面导航
响应式逻辑
主题颜色
动画
交互状态

## 模板的职责

模板统一负责：

页面结构
节点展示
概念树导航
节点缩放
左右上下文区域
关系图谱
关系类型视觉表达
搜索
筛选
页面切换
键盘操作
响应式布局
打印和导出
主题
样式
交互

核心原则：

MDX 决定“有什么知识”
模板决定“如何展示知识”

同一份 MDX 数据必须能够同时渲染为：

节点探索页
全局关系图谱页
概念树导航
搜索结果
节点详情面板

———

# 3. 核心交互模型：概念缩放

知识应该组织为一棵概念树：

L0：全局概览
└── L1：主要阶段 / 子系统
	└── L2：局部机制
		└── L3：实现细节
			└── L4：边界、异常、反例

示例：

程序编译与运行
├── 编译阶段
│   ├── 词法与语法分析
│   │   ├── 词法分析器
│   │   └── 抽象语法树
│   └── 优化与代码生成
└── 运行阶段
	├── 加载与内存映射
	└── CPU 取指与执行

概念缩放不是简单的“展开/折叠”。

它应该表现为：

点击某个节点
→ 该节点成为当前焦点
→ 父节点显示为宏观上下文
→ 当前节点显示为中心卡片
→ 子节点显示为可继续深入的节点
→ 相关节点显示在上下文和关系区域

用户始终需要知道：

- 当前正在查看哪个节点
- 当前节点属于哪条路径
- 当前节点的父节点是什么
- 当前节点有哪些子节点
- 当前节点有哪些前置知识
- 当前节点和哪些节点存在关系
- 如何返回上一级
- 如何查看全局关系

L0–L4 应主要作为：

- 节点层级标签
- 内容深度提示
- 搜索和筛选条件
- 快捷键辅助

不能只把它设计成一个全局显示/隐藏控制器。

———

# 4. 页面一：节点探索页

节点探索页用于深入理解单个概念。

桌面端推荐三栏布局：

┌────────────────┬────────────────────────┬────────────────┐
│ 宏观上下文     │ 当前节点卡片            │ 局部细节       │
│                │                        │                │
│ 根节点         │ L2                     │ 定义           │
│ ↓              │ 节点名称               │ 输入 / 输出    │
│ 父节点         │ 一句话核心             │ 前置知识       │
│ ↓              │ 核心机制               │ 代码 / 公式    │
│ 当前节点       │ 局部关系               │ 边界条件       │
│                │ 子节点入口             │ 相关节点       │
└────────────────┴────────────────────────┴────────────────┘

## 左侧：宏观上下文

左侧不应该展示整棵树的全部细节，而应该突出当前节点周围的结构：

程序编译与运行
└── 编译阶段
	└── 词法与语法分析
		└── 当前节点

左侧需要显示：

- 根节点
- 当前节点祖先路径
- 当前节点所在分支
- 同层节点
- 子树导航
- 返回父节点入口
- 当前节点高亮

点击祖先节点后，祖先节点成为新的当前节点。

## 中央：当前节点卡片

每一个概念节点都应被渲染为一个独立的解释单元。

推荐结构：

┌─────────────────────────────┐
│ L2 · 局部机制                │
│                             │
│ 词法与语法分析               │
│                             │
│ 字符流经过分析后转换成 AST。  │
│                             │
│ 输入：代码字符流             │
│ 输出：Token / AST            │
│                             │
│ 上游 → 当前 → 下钻           │
│                             │
│ [查看子节点] [查看关系]       │
└─────────────────────────────┘

中央区域可以包含：

- 层级标签
- 节点名称
- 一句话核心结论
- 定义
- 输入
- 输出
- 核心机制
- 局部关系
- 示例
- 代码
- 公式
- 子节点入口
- 相关概念入口

## 右侧：细节与上下文

右侧只显示当前节点相关的局部信息：

- 定义
- 前置知识
- 术语
- 输入/输出结构
- 关键约束
- 边界条件
- 常见误区
- 反例
- 实现细节
- 相关节点
- 跨分支关系

右侧内容应随着当前节点变化而变化。

点击相关节点后，应切换到新的当前节点，而不是打开一篇全新的长文章。

———

# 5. 页面二：全局关系图谱页

关系图谱是独立页面，用于观察整个知识系统的关系网络。

它不是节点探索页中附带的小图，而是完整的独立视图。

┌─────────────────────────────────────────────────────────┐
│ 关系图谱                         搜索 / 筛选 / 布局       │
├─────────────────────────────────────┬───────────────────┤
│                                     │                   │
│             全部概念关系图           │ 当前节点详情       │
│                                     │ 关系类型           │
│                                     │ 关联节点           │
│                                     │ 跳转节点探索       │
└─────────────────────────────────────┴───────────────────┘

图谱至少支持：

- 显示全部节点
- 显示父子关系
- 显示跨分支关系
- 显示有向关系
- 区分不同关系类型
- 节点搜索
- 层级筛选
- 关系类型筛选
- 点击节点查看详情
- 从图谱跳转到节点探索页
- 从节点探索页跳转到关系图谱页
- 跳转时自动聚焦当前节点及其邻近节点

可以使用：

SVG
Canvas
D3.js
React Flow
Cytoscape.js

但图形库只负责关系图渲染，不应该侵入 MDX 内容模型。

———

# 6. 关系类型

树关系和图关系必须分开。

## 树关系

parent-child

用于表达：

概念层级
父节点
子节点
概念缩放路径

## 图关系

至少支持：

prerequisite       前置知识
causes             因果关系
produces           产出关系
uses               使用关系
implements         实现关系
contrasts          对比关系
depends-on         依赖关系
exception-of       异常或反例关系
precedes           时序关系

关系的视觉表达由模板决定。

MDX 关系类型    模板表现
━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━
parent-child    树状连接、上下游结构
──────────────  ──────────────────────
prerequisite    虚线、依赖标识
──────────────  ──────────────────────
causes          有方向因果箭头
──────────────  ──────────────────────
produces        产出箭头
──────────────  ──────────────────────
uses            使用关系连线
──────────────  ──────────────────────
implements      实现层级连线
──────────────  ──────────────────────
contrasts       对比线或双向连接
──────────────  ──────────────────────
exception-of    警告色、异常标识
──────────────  ──────────────────────
precedes        时间方向箭头

MDX 只声明：

<Relation from="parser" to="ast" type="produces" />

模板决定：

颜色
线型
箭头
标签
节点高亮
布局
筛选方式

———

# 7. MDX 内容格式

MDX 是知识内容和关系的描述载体。

示例：

<ExplainPage
id="compiler-runtime"
title="程序编译与运行"
summary="源码经过多级转换，最终成为由 CPU 执行的机器状态变化。"
>
<ConceptGraph root="program-runtime">

	<ConceptNode
	id="program-runtime"
	title="程序编译与运行"
	level="L0"
	parent={null}
	>
	<Overview>
		源代码经过编译、加载和执行，最终驱动内存与系统状态变化。
	</Overview>

	<Definition>
		程序编译与运行描述了从人类可读代码到硬件执行状态的完整路径。
	</Definition>

	<Prerequisite>
		计算机组成原理、操作系统基础
	</Prerequisite>

	<Boundary>
		具体行为受编程语言、编译器、操作系统和硬件平台影响。
	</Boundary>
	</ConceptNode>

	<ConceptNode
	id="compile"
	title="编译阶段"
	level="L1"
	parent="program-runtime"
	>
	<Overview>
		将人类可读的源代码转换为目标平台上的可执行形式。
	</Overview>

	<Mechanism>
		源代码 → Token → AST → IR → 机器码
	</Mechanism>

	<Children>
		<ConceptRef id="parse" />
		<ConceptRef id="codegen" />
	</Children>
	</ConceptNode>

	<ConceptNode
	id="parse"
	title="词法与语法分析"
	level="L2"
	parent="compile"
	>
	<Overview>
		将字符流转换为 Token 和抽象语法树。
	</Overview>

	<Definition>
		语法分析器依据形式文法判断 Token 序列是否具有合法结构。
	</Definition>

	<Mechanism>
		字符流 → Token 流 → AST
	</Mechanism>

	<Implementation language="cpp">
		{`ASTNode parseExpression(TokenStream tokens) {
return recursiveDescent(tokens);
}`}
	</Implementation>

	<Boundary>
		语法歧义和错误恢复会影响最终 AST。
	</Boundary>
	</ConceptNode>

	<ConceptNode
	id="ast"
	title="抽象语法树"
	level="L3"
	parent="parse"
	>
	<Overview>
		AST 以树结构保存程序的嵌套关系。
	</Overview>
	</ConceptNode>

	<Relation
	from="parse"
	to="ast"
	type="produces"
	/>

	<Relation
	from="parse"
	to="formal-language"
	type="prerequisite"
	/>

	<Relation
	from="ast"
	to="codegen"
	type="uses"
	/>

</ConceptGraph>
</ExplainPage>

重要要求：

- 不在 MDX 中编写 CSS
- 不在 MDX 中编写页面布局
- 不在 MDX 中手动绘制关系图
- 不在 MDX 中重复定义节点卡片结构
- 不在 MDX 中指定三栏布局
- 不在 MDX 中指定颜色、边距、动画和响应式规则

———

# 8. 组件分层

组件应分成三层。

## 8.1 概念数据层

负责描述知识结构：

<ConceptGraph />
<ConceptNode />
<ConceptRef />
<Relation />
<Prerequisite />

## 8.2 内容层

负责描述节点内容：

<Overview />
<Definition />
<Mechanism />
<Implementation />
<Example />
<Counterexample />
<Boundary />
<Glossary />
<Input />
<Output />

## 8.3 呈现语义层

负责表达信息关系，但不直接暴露 CSS：

<Columns />
<Flow />
<Compare />
<DecisionMatrix />
<Timeline />
<Callout />
<Details />

推荐组件：

ExplainPage
ConceptGraph
ConceptNode
ConceptRef
Relation
Overview
Definition
Mechanism
Implementation
Example
Counterexample
Boundary
Prerequisite
Input
Output
Compare
DecisionMatrix
Flow
Timeline
Callout
Details
Glossary

同一个节点必须能被多个页面复用：

ConceptNode
├── 节点探索页中的中心卡片
├── 左侧概念树中的导航项
├── 关系图中的图节点
├── 右侧详情面板
└── 搜索结果

———

# 9. 数据模型

树结构和关系图结构必须分开。

## 节点模型

{
id: "parse",
title: "词法与语法分析",
level: "L2",
parent: "compile",
children: ["lexer", "ast"],

summary: "字符流经过分析后转换为 AST。",
definition: "...",
mechanism: "...",

input: "代码字符流",
output: "Token / AST",

prerequisites: [
	"正则表达式",
	"上下文无关文法"
],

implementation: "...",
examples: [],
counterexamples: [],
boundaries: "..."
}

## 关系模型

{
from: "parse",
to: "ast",
type: "produces",
label: "生成"
}

树关系负责：

父子层级
概念缩放
祖先路径
子节点导航

图关系负责：

前置知识
因果关系
产出关系
依赖关系
实现关系
对比关系
异常关系

不要把所有关系都塞进 children，否则无法表达跨分支关系。

———

# 10. 页面状态

系统需要维护统一的页面状态：

{
currentNodeId: "parse",
currentView: "explore",
focusedGraphNodeId: "parse",
selectedLevel: null,
selectedRelationType: null,
searchQuery: "",
expandedDetails: [],
zoom: 1
}

节点探索页与关系图谱页应共享当前节点状态。

## 从节点探索进入关系图谱

点击“查看全部关系”
→ 切换到关系图谱页
→ 当前节点保持选中
→ 图谱自动聚焦当前节点
→ 显示其一阶或二阶关联节点

## 从关系图谱进入节点探索

点击图中节点
→ 切换到节点探索页
→ 该节点成为中心节点
→ 左侧显示祖先路径
→ 右侧显示细节信息

———

# 11. 技术要求

优先复用现成技术和模板，不要从零实现完整文档框架。

可选技术：

MDX
React
Next.js
Vite
Nextra
Fumadocs
shadcn/ui
Tailwind CSS
D3.js
React Flow
Cytoscape.js

选择原则：

- 已有文档项目时，复用现有框架
- 单篇解释时，不引入过重工程结构
- 多篇知识库时，可以使用 Nextra 或 Fumadocs
- 图可视化库只负责图谱渲染
- 样式系统必须可替换
- 内容和模板必须解耦
- 新增知识主题时不需要修改核心渲染逻辑

———

# 12. 最终模板目录

建议目录：

concept-explain-template/
├── package.json
├── README.md
├── src/
│   ├── components/
│   │   ├── ExplainPage.jsx
│   │   ├── ConceptGraph.jsx
│   │   ├── ConceptNode.jsx
│   │   ├── ConceptRef.jsx
│   │   ├── Relation.jsx
│   │   ├── Overview.jsx
│   │   ├── Definition.jsx
│   │   ├── Mechanism.jsx
│   │   ├── Implementation.jsx
│   │   ├── Boundary.jsx
│   │   ├── Compare.jsx
│   │   ├── DecisionMatrix.jsx
│   │   └── Details.jsx
│   ├── views/
│   │   ├── NodeExplorer.jsx
│   │   └── RelationGraph.jsx
│   ├── model/
│   │   ├── concept-schema.js
│   │   ├── normalize-content.js
│   │   └── relation-types.js
│   ├── styles/
│   │   ├── concept-explain.css
│   │   ├── node-explorer.css
│   │   └── relation-graph.css
│   └── app/
│       ├── App.jsx
│       └── routes.jsx
├── content/
│   └── compile-runtime.mdx
├── scripts/
│   ├── build.mjs
│   └── clean-temp.mjs
├── public/
└── dist/

如果使用 Nextra、Fumadocs 或其他框架，可以调整目录，但必须保留：

MDX 内容层
概念节点模型
节点探索视图
关系图谱视图
可复用语义组件
统一样式系统
构建脚本
真实示例

———

# 13. 文件生命周期

## 临时解释任务

当用户只要求生成一次解释：

用户问题
→ ./tmp/dense-explain/topic.mdx
→ MDX 编译
→ 生成最终 HTML
→ 清理本次临时 MDX

临时目录固定为：

./tmp/dense-explain/

要求：

- 只清理本次生成的文件
- 不删除 ./tmp/ 下其他内容
- 不删除用户已有文件
- 不把临时 MDX 留在用户目录
- 最终默认交付 HTML

## 正式知识项目

如果用户要求长期维护：

content/topic.mdx

构建输出：

dist/topic.html

此时 MDX 是正式源文件，不能删除。

———

# 14. 示例内容要求

必须使用真实示例验证模板：

程序编译与运行

至少包含：

程序编译与运行
├── 编译阶段
│   ├── 词法与语法分析
│   │   ├── 词法分析器
│   │   └── 抽象语法树
│   └── 优化与代码生成
└── 运行阶段
	├── 加载与内存映射
	└── CPU 取指与执行

示例必须展示：

- L0–L3 节点层级
- 父子关系
- 前置知识关系
- 产出关系
- 跨分支关系
- 输入与输出
- 机制说明
- 代码实现
- 边界条件
- 至少一个反例
- 节点探索页
- 全局关系图谱页

———

# 15. 功能验收标准

## MDX 内容层

- [ ] MDX 可以定义概念节点
- [ ] MDX 可以定义节点层级
- [ ] MDX 可以声明父子关系
- [ ] MDX 可以声明语义关系
- [ ] MDX 可以描述定义、机制、代码、公式、示例和边界
- [ ] MDX 不需要写 CSS
- [ ] MDX 不需要写页面布局
- [ ] MDX 不需要手动画关系图

## 模板渲染层

- [ ] 一份 MDX 可以渲染节点探索页
- [ ] 一份 MDX 可以渲染关系图谱页
- [ ] 同一节点可以在多个视图复用
- [ ] 更换主题不需要修改 MDX
- [ ] 更换布局不需要修改 MDX
- [ ] 新增节点不需要修改核心渲染逻辑
- [ ] 新增关系不需要修改核心渲染逻辑

## 节点探索页

- [ ] 当前节点有明确焦点
- [ ] 左侧显示祖先路径
- [ ] 左侧显示同层节点和概念树
- [ ] 中间显示当前节点卡片
- [ ] 右侧显示局部细节
- [ ] 点击子节点后可以继续下钻
- [ ] 点击父节点后可以返回上一级
- [ ] 当前节点路径始终可见
- [ ] 可以跳转到关系图谱页

## 关系图谱页

- [ ] 独立展示所有节点
- [ ] 展示父子关系
- [ ] 展示跨分支关系
- [ ] 区分关系类型
- [ ] 支持搜索
- [ ] 支持筛选
- [ ] 支持点击节点
- [ ] 支持查看节点详情
- [ ] 可以跳转到节点探索页
- [ ] 跳转后保持当前节点上下文

## 工程实现

- [ ] MDX 可以实际编译
- [ ] 页面可以实际运行
- [ ] 不依赖一个超长 HTML 文件
- [ ] 模板和示例分离
- [ ] 内容和样式分离
- [ ] 构建产物和源文件分离
- [ ] 临时文件位于 ./tmp/dense-explain/
- [ ] 提供启动命令
- [ ] 提供构建命令
- [ ] 提供清理命令
- [ ] 提供 README
- [ ] 完成一次完整构建测试
- [ ] 完成一次节点切换测试
- [ ] 完成一次关系图交互测试

———

# 16. 禁止的实现方式

不要实现成：

普通 Markdown
+ 一些卡片
+ 一个递归树
+ 一张静态图

不要让 AI 每次生成：

HTML
CSS
页面布局
节点卡片
关系图 SVG
交互脚本

不要把所有内容硬编码在：

单个超长 HTML 文件
单个超长 JavaScript 文件

不要让 MDX 负责：

三栏布局
颜色
间距
CSS class
图谱布局
节点定位
页面状态

真正需要实现的是：

MDX 知识内容与语义关系
→ 概念节点树
→ 节点探索视图
→ 全局关系图谱
→ 连续的概念缩放体验

最终目标：

> AI 只生成知识节点、内容和语义关系；模板自动把这些内容渲染成一个支持概念
> 缩放、节点探索、关系观察和上下文导航的知识界面。