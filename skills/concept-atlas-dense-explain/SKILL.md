---
name: concept-atlas-dense-explain
description: 把主题或 source document 整理成语义化 MDX，并编译为 standalone HTML 交互式 Concept Atlas 页面，支持概念图谱、公式、图表、配图和引用。适用于把材料做成交互式 HTML/MDX 讲解页、教程、技术深潜、报告页、概念图、知识地图或分层教学页面，包括“把这份文档变成网页”“讲清楚一点并做成页面”等请求，也覆盖 讲解 / 深度长文 / 教程 / 技术文档 / 报告 / 概念图 / 知识地图 / 分层讲解 等说法。Not for 简短聊天回答、仅摘要、幻灯片或只交付 Word/PDF 的任务。
---

# Concept Atlas Dense Explain

把主题或源文档整理成语义化 MDX，并使用 `concept-atlas-dense-explain` CLI 编译。所需内容都在本文件和随附的 `references/` 中；不要阅读框架仓库或已安装包的实现文件，不要从 skill 目录复制实现文件，也不要重新创建 React/Vite 应用。

如果用户只需要方法说明或 MDX 文本，仍选择一种页面外壳并输出合法 MDX。只有在需要产出文件时，才需要进行 CLI 校验和编译。

## 运行规则

- 只通过 `npx` 使用 CLI。不要寻找其他运行方式，也不要运行框架仓库自己的脚本。
- 每个文件只使用一种页面外壳。保持 MDX 语义化：不要写 CSS、SVG、自定义 React 或臆造组件 API。只有用户明确要求手工布局时，才使用自由定位坐标。
- 保留源材料中的论断、引用、反例和不确定性。不要为了页面显得完整而编造证据、测量数据、参考文献或示例。
- 保护用户文件。`create`、`guide` 和编译产物会覆盖目标；`guide` 还会覆盖输出旁边的 `assets/`。请选择新路径，或在覆盖已有文件前询问用户。
- 不要预加载或通读 references。先搜索当前任务的关键词，只读命中章节；guide 也按组件名检索，不通读。只有在当前步骤需要时才打开对应文件。

## 工作流程

1. **确定交付物。** 识别源材料、目标读者、输出路径，以及用户只需要 MDX 还是要编译后的 HTML。只有在选择不明确或会覆盖用户文件时才提问。
2. **选择页面外壳。** 使用下方决策表。如果已有 `.mdx` 文件，检测其外壳并保留，除非用户要求转换。
3. **写标签前先查 API。** 在 `references/components.md` 中搜索组件名，只读对应的 props 行；若涉及数组 prop，再搜索 `Shapes and traps` 下的同名条目。未知 prop 会被静默忽略，因此不要猜测。需要完整组合示例时，再到 `references/atlas-guide.mdx` 或 `references/scroll-guide.mdx` 中搜索该组件名，不要通读 guide。
4. **起草语义化 MDX。** 需要时先从 `create` 开始，再应用下方写作约定。仅在需要文档转换、源材料映射或判断完成度时，读取 `references/authoring.md` 的对应章节；其他情况跳过。
5. **渲染前校验。**
   ```bash
   npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll
   npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll --json
   ```
   修复所有错误（error）后重新运行。成本不高时处理警告（warning）；用户要求干净的结构契约时使用 `--strict`。出现诊断代码时，只在 `references/diagnostics.md` 中搜索该代码并读取对应行；没有诊断时不要打开该文件。
6. **编译。** 只在需要确认输出、外观、批处理或资源行为时，搜索 `references/cli.md` 的对应命令或参数，只读命中章节，不要通读。
   ```bash
   npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll [-o out.html]
   ```
   校验错误（error）会阻止构建。只有有明确理由时才使用 `--no-validate`。
7. **验证结果。** 确认 HTML 文件存在。有浏览器工具时，打开页面并检查标题、外壳导航，以及添加的每个图表、流程图、配图、标签页或引用。修复空白可视化组件或损坏的交互；否则说明还有哪些内容未验证。
8. **报告结果。** 说明页面外壳、MDX 和 HTML 路径、校验结果、重构/合并/删除的源材料，以及实际适用的限制。图表不依赖图表 CDN（diagrams need no chart CDN），但字体可能远程加载，本地图片除非内联否则仍为链接。不要声称验证过未实际检查的交互。

## 外壳决策

| 阅读任务 | 外壳 | 结构 |
| --- | --- | --- |
| 探索概念、比较分支、追踪关系 | `atlas` | `ExplainPage` → `ConceptGraph` → `ConceptNode`，通过 `Children` / `ConceptRef` 和跨分支 `Relation` 组织 |
| 按顺序阅读论证、教程、流程或报告 | `scroll` | `ScrollDocument` → `ScrollHeader` + `ScrollSection`，章节（section）内使用共享内容组件 |
| 已有 MDX | 检测并保留 | 只在用户要求时转换外层外壳；绝不合并两种外壳 |

对于 `atlas`，保持恰好一个 `L0` 根节点，并使用 `L1`–`L4` 表示逐层细化的内容。对于 `scroll`，外壳根据章节（section）标题自动生成目录和阅读进度；不要手工构建导航。为 `ExplainPage title` 或 `ScrollHeader title` 提供真实的静态字符串，因为它会成为浏览器标签页标题。

## 写作约定

- 每个重要概念使用主张式标题；外壳支持时提供一句话摘要；正文必须增加新信息。合并空壳，而不是填充内容。
- 密度意味着信息增益，不是配额。覆盖概念是什么、为什么/如何工作、证据或示例（如有）、边界或权衡（如相关）；读者的问题得到回答后就停止。
- 只在知识角色明确时使用 `kind`。`mechanism` 应包含 `Invariant` 或 `Evidence`；`failure` 应包含结构化的 `FailureMode`。
- 关系类型用于跨分支语义，不用于父子层级。每个 `Relation` 都需要有意义的 `label`。
- 需要数组 prop 时，只在 `components.md` 的 `Shapes and traps` 中搜索同名组件。按文档规定的字符串/模板字面量形式传递 LaTeX 和代码，避免 MDX 将它们解析为表达式。
- 始终设置配图 `alt`；使用 `id` + `FigureRef` 自动编号。在 `atlas` 中，`Cite` 和 `References` 放在同一节点。
- 在外壳上配置阅读节奏和字号，不要使用手工 CSS。

## 参考文件路由

| 需求 | 文件 | 加载方式 |
| --- | --- | --- |
| 组件 props、默认值、数组形状、别名和陷阱 | `references/components.md` | 搜索组件名；只读 props 行和同名陷阱条目 |
| 文档转换、源材料保真、密度和停止条件 | `references/authoring.md` | 仅在转换或完成度检查时读取对应章节 |
| 命令、参数、外观、批处理、资源和版本不一致 | `references/cli.md` | 搜索命令或参数；只读命中章节 |
| 诊断含义和修复动作 | `references/diagnostics.md` | 搜索诊断代码；只读对应行 |
| 可编译的组合示例 | `references/atlas-guide.mdx` 或 `references/scroll-guide.mdx` | 搜索组件名；只读附近示例 |

## 失败恢复

- 如果 `npx` 无法访问 npm registry，报告阻塞；不要切换到仓库构建或复制实现文件。
- 如果 CLI 拒绝当前 skill 文档中的组件，检查 `--version`，报告可能的 skill/CLI 版本不一致，不要臆造变通方案。
- 如果按文档修复后仍校验失败，报告剩余诊断和文件位置，不要静默使用 `--no-validate`。
