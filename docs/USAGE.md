# Concept Atlas CLI 与开发指南

Concept Atlas 的 CLI 直接编译单个 MDX 文件，不需要初始化项目、复制模板或维护 Vite 配置。内容编写规范见 [`FRAMEWORK.md`](./FRAMEWORK.md)。

## 1. 快速开始

```bash
# 生成起稿；--mode 默认为 scroll
npx concept-atlas-dense-explain create topic.mdx --mode atlas

# 校验后再编译
npx concept-atlas-dense-explain validate topic.mdx --mode atlas
npx concept-atlas-dense-explain topic.mdx --mode atlas
```

默认输出是输入文件同目录下的同名 `.html`。`create`、`guide` 和编译输出都会覆盖已有文件；需要保留旧文件时先换一个输出路径。

连续阅读文档：

```bash
npx concept-atlas-dense-explain create article.mdx --mode scroll
npx concept-atlas-dense-explain article.mdx --mode scroll -o dist/article.html
```

`guide` 只用于生成一份可编译的组件示例。它会把示例资源复制到输出目录旁的 `assets/`，已有同名文件会被覆盖。skill 已经自带示例，不需要为了学习组件重复生成：

```bash
npx concept-atlas-dense-explain guide --mode atlas -o atlas-guide.mdx
npx concept-atlas-dense-explain guide --mode scroll -o scroll-guide.mdx
```

## 2. 命令与参数

| 命令 / 参数 | 作用 |
| --- | --- |
| `create <file.mdx>` | 生成起稿骨架 |
| `guide` | 输出可编译的组件示例 |
| `validate <file.mdx>` | 校验结构，不生成 HTML |
| `<file.mdx>...` | 校验并编译一个或多个文件 |
| `--mode atlas\|scroll` | 指定外壳；`create` / `guide` 默认 `scroll`，`validate` / 编译省略时自动识别 |
| `-o <path>` | 输出文件；多输入时是输出目录 |
| `--strict` | 把结构警告升级为错误 |
| `--json` | 机器可读输出；批量模式返回数组 |
| `--no-validate` | 跳过校验，允许生成已知有问题的页面 |
| `--inline-assets` | 内联全部本地图片 |
| `--link-assets` | 显式使用默认外链；不能与 `--inline-assets` 同用 |
| `--concurrency <N>` | 批量构建并发，默认 2，上限 4 |
| `--skin <id>` | 烘焙默认配色 |
| `--default-mode dark\|light\|system` | 烘焙默认明暗模式 |
| `--style <id>` | 烘焙默认组件风格 |
| `--force` | 兼容性空操作；输出本来就会覆盖 |
| `--version` | 打印 CLI 版本 |

校验示例：

```bash
npx concept-atlas-dense-explain validate topic.mdx --mode atlas
npx concept-atlas-dense-explain validate topic.mdx --mode atlas --json
npx concept-atlas-dense-explain validate topic.mdx --mode atlas --strict
```

### 批量编译

```bash
npx concept-atlas-dense-explain papers/a.mdx papers/b.mdx papers/c.mdx -o dist
npx concept-atlas-dense-explain papers/*.mdx -o dist --concurrency 3
```

批量模式会先校验全部文件，再开始构建。任意一个文件有错误时不会构建；`--no-validate` 可跳过。每个 Vite 构建会占用一定内存，建议并发不超过 3。

### 按需裁剪渲染器

- 没有 `<Math>` / `<MathBlock>` 时，KaTeX 及其约 1.4MB 内联字体不会进入产物。
- 没有 `<Mermaid>` 时，Pele 不会进入产物。
- 不要添加占位组件来“启用”渲染器；正常编写真正需要的内容即可。

## 3. 图表、图片与离线行为

### Mermaid / Pele

`<Mermaid>` 接受标准 Mermaid 语法，由 [Pele](https://pele.run) 在页面内渲染并内联为 SVG。图表本身不需要 CDN；Pele 的布局和视觉风格与 Mermaid.js 不同，`themeVariables` 不生效，颜色由页面的 `--pele-*` CSS 变量控制。

```mdx
<Mermaid
  title="请求处理流程"
  chart={`flowchart LR
    A[客户端] --> B[路由]
    B --> C[控制器]
    C --> D[响应]`}
/>
```

一张图只表达一个局部问题。复杂主题拆成多张图，避免图本身成为噪音。

### 图片：默认外链

相对路径图片默认保持外链，HTML 更小，但必须把 `assets/` 放在输出 HTML 能找到的位置。`-o` 指向其他目录时，CLI 会提示相对路径可能失效。

```bash
# 默认外链
npx concept-atlas-dense-explain paper.mdx

# 全部内联，适合单文件分发
npx concept-atlas-dense-explain paper.mdx --inline-assets
```

单图可以覆盖全局设置，优先级为 **组件 `inline` prop > 全局开关 > 默认外链**：

```mdx
<Figure src="./arch.svg" alt="架构" caption="默认跟随全局" />
<Figure src="./huge.png" alt="大截图" inline={false} />
<Figure src="./logo.svg" alt="图标" inline={true} />
```

- 远程 `http(s)`、`data:` 和绝对路径不参与内联；远程图需要网络并会产生 `ASSET_REMOTE`。
- 内联单图超过 512KB 会产生 `ASSET_LARGE`。
- 找不到本地图片会产生 warning 和占位符，不阻断构建。
- 字体默认可能从 Google Fonts 加载；离线时回退到系统字体栈。

因此“单文件 HTML”不等于“所有外部资源都已内联”：JS/CSS 和图表已内联，字体与图片要按上述规则单独处理。

## 4. 外观系统

每个页面都提供读者可见的外观菜单：

- 配色：`aurora`、`ember`、`verdant`、`sakura`、`noir`。
- 明暗：亮色 / 暗色。
- 组件风格：`manuscript`、`classic`、`shadcn`、`elastic`。

默认是 **aurora × manuscript × 亮色**，选择保存在 localStorage，Atlas 与 Scroll 共享。需要不同的编译期默认值时：

```bash
npx concept-atlas-dense-explain paper.mdx \
  --skin ember --default-mode dark --style classic
```

仓库自身构建也可以使用环境变量：

```bash
CONCEPT_ATLAS_SKIN=ember \
CONCEPT_ATLAS_DEFAULT_MODE=dark \
CONCEPT_ATLAS_STYLE=classic \
npm run build
```

默认外观在首屏渲染前写入，避免闪烁。内容 MDX 不设置外观。

## 5. 仓库开发

```bash
npm install
npm run dev          # 启动本地开发服务
npm test             # 单元测试、渲染冒烟、文档与打包检查
npm run validate     # 校验 content/*.mdx
npm run lint
npm run format:check
npm run audit:css
npm run check:sync   # 检查 npm 模板是否与 src/ 同步
npm run sync         # 重新生成 npm 模板
npm run build        # 校验并构建两个演示入口
```

构建产物：

- `dist/index.html`：Atlas 组件展厅。
- `dist/scroll.html`：Scroll 连续阅读示例。

两个文件都内联 JS/CSS，可直接分发；仓库 demo 构建会强制内联示例图片，字体仍遵循上一节的远程加载与离线回退规则。

## 6. 内容入口与源码结构

```text
content/atlas-guide.mdx       # Atlas 组件展厅
content/scroll-guide.mdx      # Scroll 连续阅读示例
content/compile-runtime.mdx   # 长文编译与运行示例
src/main.jsx                  # Atlas 演示入口
src/scroll-main.jsx            # Scroll 演示入口
src/components/               # MDX 组件实现
src/model/                    # 语义提取、校验、引用与概念模型
src/views/                    # Atlas 探索与关系图
src/styles/                   # 基础样式、皮肤、组件风格与动效
scripts/sync-template.mjs     # 将 src/ 同步到 npm 包模板
test/                         # 测试
```

`src/` 是运行时实现的唯一真相源。npm 包模板和 skill 中的示例由同步脚本生成。

## 7. Skill 文档与生成物

Skill 入口是 [`skills/concept-atlas-dense-explain/SKILL.md`](../skills/concept-atlas-dense-explain/SKILL.md)，按任务拆分：

- [`references/components.md`](../skills/concept-atlas-dense-explain/references/components.md)：组件 API、默认值、数组形状与陷阱。
- [`references/authoring.md`](../skills/concept-atlas-dense-explain/references/authoring.md)：文档转换、溯源、密度与停止条件。
- [`references/cli.md`](../skills/concept-atlas-dense-explain/references/cli.md)：命令、flag、外观、资源与版本不一致处理。
- [`references/diagnostics.md`](../skills/concept-atlas-dense-explain/references/diagnostics.md)：诊断分类与修复动作。

`components.md` / `diagnostics.md` 是手写作者文档，但必须与实现同步。`test/skill-docs.test.mjs` 会核对完整 prop API、数组契约和诊断分类；`test/package-skill.test.mjs` 检查发布包是否包含完整 skill。

生成关系：

- `src/` → `packages/concept-atlas-dense-explain/template/`。
- `content/` → npm 模板的 `references/`，同时生成 skill 内的两份指南和示例资源。
- `skills/` → npm 包的 `packaged-skill/`，仅在 `prepack` 时生成，被 `.gitignore` 忽略。

提交前运行 `npm run check:sync`；发布前运行 `npm pack --dry-run` 核对 tarball。

## 8. 新增组件

1. 在 `src/components/MDXComponents.jsx` 实现并导出。
2. 把组件名加入 `src/model/validate-content.js` 的 `KNOWN_COMPONENTS`。
3. 如果是数组 prop，加入 `ARRAY_PROPS`。
4. 更新 `skills/concept-atlas-dense-explain/references/components.md`。
5. 运行 `npm run sync`、`npm test` 和 `npm run build`。
