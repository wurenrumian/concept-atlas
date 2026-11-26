# CLI 参考

仅在需要创建骨架、校验、编译、批量构建、外观或资源行为时查阅本参考；先搜索命令或参数，只读命中章节，不要通读。主流程见 `SKILL.md`。

## 运行入口

始终通过 `npx` 调用 CLI，可从任意目录运行：

```bash
npx concept-atlas-dense-explain <args>
```

这是唯一的运行入口。不要查找本地二进制文件、仓库检出副本或已安装副本，也不要运行框架仓库自身的 `npm` 脚本。首次调用可能会从 npm 下载包；只需向用户说明一次，然后继续。参数不明确时使用 `npx concept-atlas-dense-explain help`，诊断版本不匹配时使用 `--version`。

## 核心命令

```bash
# 可选骨架；默认使用 scroll 并覆盖目标文件。
npx concept-atlas-dense-explain create <file>.mdx --mode atlas|scroll

# 渲染前先校验。
npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll
npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll --json

# 编译；省略 --mode 时检测 MDX 外壳，除非指定 -o，否则写入 MDX 旁。
npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll [-o out.html]

# 构建多个文档；-o 表示目录。
npx concept-atlas-dense-explain a.mdx b.mdx c.mdx -o dist [--concurrency 3]
```

`create`、`guide` 和编译后的 HTML 输出会覆盖现有文件。`guide` 还会把示例资源复制到输出旁的 `assets/`，并覆盖同名文件。除非确实要覆盖，否则不要将其指向包含用户工作的路径；应选择新路径或先询问。

只有当用户需要一份项目本地、可编译的内置示例副本时，才需要使用 `guide`。已安装的技能已包含 `references/atlas-guide.mdx` 和 `references/scroll-guide.mdx`；不要为了解组件而再生成一份副本。

## 参数（flags）

| 参数 | 含义 |
| --- | --- |
| `--mode atlas\|scroll` | 选择页面外壳。`create` / `guide` 默认为 `scroll`；校验和构建在省略时会检测外壳。指定后，请在各个命令中保持一致。 |
| `-o <path>` | 输出 HTML 文件；多个输入时表示输出目录。 |
| `--strict` | 将结构性警告提升为校验错误。 |
| `--json` | 机器可读的校验输出。 |
| `--no-validate` | 跳过校验，并允许构建出损坏的页面。仅在理由明确时使用。 |
| `--inline-assets` | 将每张本地图片内联为 base64。 |
| `--link-assets` | 默认图片外链行为的显式别名；与 `--inline-assets` 互斥。 |
| `--concurrency <N>` | 多个输入的并行构建上限；默认为 2，最高为 4。 |
| `--skin <id>` | 内置默认配色。 |
| `--default-mode dark\|light\|system` | 内置默认明暗模式。 |
| `--style <id>` | 内置默认组件风格。 |
| `--force` | 兼容性空操作；输出本来就会被覆盖。 |

## 外观

页面提供面向读者的外观菜单：配色（`aurora` 靛蓝、`ember` 金色、`verdant` 森林绿、`sakura` 粉紫、`noir` 墨黑）、深色/浅色模式，以及组件风格（`manuscript` 社论式旁注、`classic` 方框卡片、`shadcn` 细边框极简界面、`elastic` 带边框的可观测性面板）。随附的默认值为 aurora × manuscript × light，选择会持久保存在 localStorage 中。

仅在用户要求时内置不同的默认值：

```bash
npx concept-atlas-dense-explain article.mdx --mode scroll \
  --skin ember --default-mode dark --style classic
```

`--default-mode system` 会解析为载体的默认值（`light`）。内容 MDX 从不设置外观。

## 资源与离线行为

- `<Mermaid>` 图表由 Pele 渲染并内联，因此不需要图表 CDN。不含 `<Mermaid>` 的页面会完全移除渲染器。
- 字体可能在运行时从 Google Fonts 加载，离线时回退到系统字体栈。
- 本地图片默认保持相对链接。请将 `assets/` 目录放在 HTML 旁，或使用 `--inline-assets`。
- 单图的 `inline={true}` / `inline={false}` 会覆盖该图片的全局参数。
- 远程图片保持链接，需要网络访问。
- 切勿为了启用渲染器而添加无意义的 `<Math>` 或 `<Mermaid>` 节点；构建只包含内容实际用到的部分。

## 版本不匹配

技能文档与 npm `latest` CLI 分别发布。如果 `npx` 获取 `latest` 后，文档中的组件被拒绝并报 `UNKNOWN_COMPONENT`，请报告可能的版本不匹配以及涉及的版本。不要把包实现文件复制到技能中，不要编造替代 API，也不要静默降级页面。
