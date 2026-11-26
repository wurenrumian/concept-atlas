# 校验诊断

只在出现诊断代码时搜索该代码并读取对应行，不要通读。面向人的诊断采用 `error|warn line:column CODE message` 格式；`--json` 返回结构化对象。构建前修复所有错误。警告通常表示页面仍可渲染，但会损失结构、来源信息或读者理解的清晰度；修复成本较低时应处理警告，若要求结果无警告，请使用 `--strict`。

## Errors — fix before building（错误：构建前修复）

| 代码 | 含义 | 处理方式 |
| --- | --- | --- |
| `UNKNOWN_COMPONENT` | 标签未注册。 | 替换为 `components.md` 中的组件；不要发明别名，但允许用 `Image` 作为 `Figure` 的别名。 |
| `CARRIER_MISSING` | 未找到页面外壳。 | 只添加一个 `ExplainPage` 或 `ScrollDocument` 页面外壳。 |
| `CARRIER_CONFLICT` | 同一文件中出现两种页面外壳。 | 只保留一种；转换外层结构，而不要将两者嵌套。 |
| `CARRIER_MODE_MISMATCH` | 文件所用页面外壳与 `--mode` 不一致。 | 传入匹配的 `--mode atlas` 或 `--mode scroll`，或转换文件。 |
| `NODE_MISSING_ID` | `ConceptNode` 没有稳定的 id。 | 添加唯一的 kebab-case 格式 id。 |
| `DUPLICATE_NODE_ID` | 两个节点共用一个 id。 | 重命名其中一个，并更新 `parent`、`ConceptRef` 和 `Relation` 中的引用。 |
| `NODE_MISSING_TITLE` | 节点没有可读标题。 | 添加主张式 `title`；仅有 id 不够。 |
| `MISSING_PARENT` | 非根节点指向了不存在的父节点。 | 更正父节点 id；若该节点是根节点，则移除父节点设置。 |
| `GRAPH_ROOT_UNRESOLVED` | `ConceptGraph root` 未指向任何节点。 | 将其指向 `L0` 节点的 id。 |
| `REF_MISSING_ID` | `ConceptRef` 没有 id。 | 添加目标节点 id。 |
| `REF_UNRESOLVED` | `ConceptRef` 指向不存在的节点。 | 更正 id，或添加缺失的节点。 |
| `RELATION_FROM_UNRESOLVED` | 关系的来源 id 不存在。 | 更正 `from`，或添加来源节点。 |
| `RELATION_TO_UNRESOLVED` | 关系的目标 id 不存在。 | 更正 `to`，或添加目标节点。 |

## Warnings — fix when cheap（警告：成本较低时修复）

| 代码 | 含义 | 处理方式 |
| --- | --- | --- |
| `NODE_MISSING_SUMMARY` | 节点没有一句话摘要。 | 添加 `summary`；在 atlas 中，仅包含字符串的 `Overview` 可以提供该摘要。 |
| `NODE_NO_CORE_CONTENT` | 节点仅重复元数据或导航。 | 添加定义、机制、证据、示例、模型或边界内容；若它只是空壳，则合并该节点。 |
| `NO_ROOT_LEVEL` | atlas 没有 `L0` 根节点。 | 只将一个根节点标记为 `level="L0"`；`--strict` 会将此警告升级为错误。 |
| `MULTIPLE_ROOT_LEVEL` | 有多个节点被标记为 `L0`。 | 只保留一个 `L0`；将其他顶层分支设为 `L1`。 |
| `UNKNOWN_LEVEL` | `level` 超出 `L0`–`L4` 范围。 | 使用符合节点认知深度的已声明层级。 |
| `UNKNOWN_KIND` | `kind` 不在白名单中。 | 使用 `system`、`stage`、`mechanism`、`artifact`、`failure`、`tool`、`boundary` 或 `decision`，或省略该属性。 |
| `MECHANISM_KIND_UNVERIFIED` | 机制节点缺少 `Invariant` 或 `Evidence`。 | 添加使该机制可检验的不变量或证据。 |
| `FAILURE_KIND_UNSTRUCTURED` | 失效节点缺少结构化的 `FailureMode`。 | 添加 `symptom`、`cause`、`evidence` 或 `remedy`；`--strict` 会将此警告升级为错误。 |
| `FAILURE_MODE_EMPTY` | 自闭合的 `FailureMode` 没有字段或子内容。 | 至少提供一个失效字段或解释性子内容。 |
| `UNKNOWN_RELATION_TYPE` | 关系类型不在白名单中。 | 使用 `SKILL.md` 中的类型；不要用关系表达父子层级。 |
| `RELATION_MISSING_LABEL` | 边没有面向读者的标签。 | 添加简短的 `label`，说明该关系的含义。 |
| `RELATION_SELF` | 关系的起点和终点为同一节点。 | 移除该关系，或连接两个不同的节点。 |
| `PROP_EXPECTS_ARRAY` | 数组 prop 收到字符串或非数组表达式。 | 传入数组字面量，例如 `steps={[...]}`；数组项的形状请查阅 `components.md`。 |
| `MATH_CHILDREN_BRACES` | 子内容中的 LaTeX 包含 MDX 表达式语法。 | 将公式移到 `formula="..."` 中，或改用模板字面量。 |
| `PROSE_EXPRESSION` | 说明文字被解析为 JavaScript 表达式。 | 转义或重写花括号；若需原样展示语法，请使用代码块。 |
| `FRONTMATTER_UNSUPPORTED` | MDX frontmatter 使用了渲染器不会读取的字段。 | 移除不支持的字段；将编写元数据保留在页面外壳之外。 |
| `GRAPH_MISSING_ROOT` | `ConceptGraph` 没有显式根节点。 | 添加 `root="<L0-id>"`；目前省略该属性会推断根节点并发出警告。 |
| `FIGURE_MISSING_SRC` | `Figure` 没有图片来源。 | 添加有效的本地路径或远程 URL。 |
| `ASSET_MISSING` | 相对图片路径不存在。 | 更正相对于 MDX 文件的路径。 |
| `ASSET_REMOTE` | 图片使用 `http(s)` URL。 | 仅在可以接受远程加载时保留；否则改用本地资源。 |
| `ASSET_LARGE` | 超过 512KB 的资源会被 `--inline-assets` 或单图的 `inline` prop 内联。 | 压缩该资源、改为链接，或为该图设置 `inline={false}`。 |
| `FIGURE_REF_UNRESOLVED` | `FigureRef` 指向不存在的图 id。 | 添加匹配的 `id`，或更正引用。 |
| `FIGURE_REF_MISSING_ID` | `FigureRef` 没有 id。 | 添加目标图 id。 |
| `FIGURE_DUPLICATE_ID` | 两个图共用一个 id。 | 重命名其中一个，并更新其引用。 |
| `REF_SELF` | 节点将自身列为子节点。 | 移除自引用；使用 `parent` 和 `Children` 表达真正的层级关系。 |

## Promoted by `--strict`（严格模式升级为错误）

`NO_ROOT_LEVEL`、`MULTIPLE_ROOT_LEVEL`、`MECHANISM_KIND_UNVERIFIED` 和 `FAILURE_KIND_UNSTRUCTURED` 都是警告，`--strict` 会将它们升级为错误。前两项表示 atlas 的 `L0` 根节点数量为零或多个；请确保恰好只有一个根节点。
