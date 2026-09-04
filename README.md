# Concept Atlas · 基于 MDX 的概念缩放式知识讲解模板

本项目是一套基于 **MDX 语义化知识描述** 与 **现代响应式前端渲染** 的完整知识解释系统。

核心理念：**让 AI / 创作者只负责用语义组件描述知识内容与概念关系，由模板引擎全权负责页面三栏结构、视觉样式、多级概念缩放（L0–L4）以及全局关系图谱的交互呈现。**

---

## 目录结构

```text
concept-atlas/
├── package.json                 # 项目依赖与运行脚本
├── README.md                    # 项目说明文档
├── vite.config.js               # Vite + MDX 构建配置
├── index.html                   # 网页挂载入口
├── src/
│   ├── main.jsx                 # 引导挂载脚本
│   ├── app/
│   │   └── App.jsx              # 统一状态管理与视图切换器
│   ├── components/              # MDX 语义组件层
│   │   ├── MDXComponents.jsx    # 数据层/内容层/呈现语义层组件定义
│   │   └── index.js
│   ├── views/                   # 核心渲染视图
│   │   ├── NodeExplorer.jsx     # 页面一：三栏式概念探索页 (概念缩放/上下文/下钻)
│   │   └── RelationGraph.jsx    # 页面二：全局关系图谱页 (D3力导向/过滤/交互跳转)
│   ├── model/                   # 数据模型与语义关系定义
│   │   ├── relation-types.js    # 树关系与图关系字典定义及视觉元数据
│   │   ├── concept-schema.js    # 概念树/图谱校验、索引与上下文提取逻辑
│   │   └── normalize-content.js # MDX JSX AST 节点与语义提取器
│   └── styles/
│       └── concept-explain.css  # 统一样式系统
├── content/
│   └── compile-runtime.mdx      # 真实知识示例：程序编译与运行
├── scripts/
│   ├── build.mjs                # 构建单文件 HTML 或静态产物脚本
│   └── clean-temp.mjs           # 临时解释任务清理脚本
├── tmp/                         # 临时生成文件目录
└── dist/                        # 正式构建输出目录
```

---

## 特性亮点

1. **严格的职责边界**：
   - MDX 中禁止编写任何 CSS、页面布局、HTML 卡片标签或手动 SVG。
   - MDX 仅声明 `<ConceptNode>`, `<Relation>`, `<Overview>`, `<Mechanism>`, `<Boundary>` 等语义标签。
2. **真正的概念缩放 (L0–L4)**：
   - 支持从宏观全局概览 (L0) ➔ 主要阶段 (L1) ➔ 局部机制 (L2) ➔ 实现细节 (L3) ➔ 边界反例 (L4) 进行逐层认知。
   - 点击子节点顺畅下钻，左侧保留完整祖先溯源路径与同层节点切换，避免信息过载。
3. **两套一体化视图**：
   - **节点探索页**：桌面端三栏布局（左侧宏观上下文、中央当前概念卡片与流水线、右侧细节约束与跨分支关联）。
   - **全局关系图谱页**：力导向图可视化，区分父子关系与语义图关系（如 `produces`、`prerequisite`、`uses`、`precedes`、`implements`），支持节点搜索、层级筛选、关系过滤，且可双向一键跳转并保持聚焦状态。
4. **快捷键盘操作**：
   - 按 `1` 或 `e` 切换至节点探索页。
   - 按 `2` 或 `g` 切换至全局关系图谱页。
   - 按 `Esc` 返回上一级父节点。

---

## 常用开发命令

完整的内容编写、组件参数、Mermaid 和画布布局说明请阅读：[docs/USAGE.md](docs/USAGE.md)

### 启动本地开发服务
```bash
npm run dev
```

### 构建正式发布文件 (生成单文件 HTML)
```bash
npm run build
```
产物将输出到 `dist/index.html`，可在任何现代浏览器中离线打开预览。

### 清理临时解释任务产物
```bash
npm run clean:temp
```

---

## 如何编写新的知识 MDX

只需在 `content/` 或 `tmp/dense-explain/` 目录下创建 `.mdx` 文件，例如：

```mdx
<ExplainPage id="my-topic" title="我的知识主题" summary="一句话概括">
  <ConceptGraph root="root-node">
    <ConceptNode id="root-node" title="系统根概念" level="L0">
      <Overview>系统的全局认知阐述...</Overview>
      <Children>
        <ConceptRef id="sub-node-1" />
      </Children>
    </ConceptNode>

    <ConceptNode id="sub-node-1" title="子模块" level="L1" parent="root-node">
      <Mechanism>输入 -> 处理 -> 输出</Mechanism>
    </ConceptNode>

    <Relation from="root-node" to="sub-node-1" type="causes" label="触发" />
  </ConceptGraph>
</ExplainPage>
```
无需修改任何 CSS 或核心渲染引擎，系统会自动编译为完整的知识交互网页。
