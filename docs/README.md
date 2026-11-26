# 文档导航

按阅读任务选择文档，避免在入门、编写和开发资料之间重复查找。

| 想做什么 | 阅读 |
| --- | --- |
| 了解项目、安装并生成第一个页面 | [根 README](../README.md) |
| 选择 Atlas / Scroll、编写语义 MDX、使用组件 | [FRAMEWORK.md](./FRAMEWORK.md) |
| 使用 CLI、处理图片与离线、配置外观、开发仓库 | [USAGE.md](./USAGE.md) |
| 让 AI agent 生成 Concept Atlas 页面 | [SKILL.md](../skills/concept-atlas-dense-explain/SKILL.md) |
| 查询组件 prop、数组形状与默认值 | [components.md](../skills/concept-atlas-dense-explain/references/components.md) |
| 把现有文档重构成页面 | [authoring.md](../skills/concept-atlas-dense-explain/references/authoring.md) |
| 查询 CLI flag 与失败恢复 | [cli.md](../skills/concept-atlas-dense-explain/references/cli.md) |
| 根据校验错误修复内容 | [diagnostics.md](../skills/concept-atlas-dense-explain/references/diagnostics.md) |

## 分工约定

- 根 `README.md`：项目定位、安装、最小示例和文档入口。
- `docs/FRAMEWORK.md`：内容作者视角，只讲外壳、组件语义、编写规则与校验。
- `docs/USAGE.md`：工具与仓库视角，只讲 CLI、资源、外观、开发、同步与发布。
- `skills/`：agent 的执行入口与按需加载的参考，不重复项目开发文档。
