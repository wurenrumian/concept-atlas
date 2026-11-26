---
name: concept-atlas-dense-explain
description: Build a dense, interactive Concept Atlas page from a topic or source document — semantic MDX compiled to standalone HTML, with concept graphs, math, charts, figures, and citations. Use it when someone wants material turned into an interactive HTML/MDX explainer, tutorial, technical deep-dive, report, concept/knowledge map, or teaching page, including "turn this doc into a page" or "explain this properly as a page"; also 讲解 / 深度长文 / 教程 / 技术文档 / 报告 / 概念图 / 知识地图 / 分层讲解. Not for a short chat answer, summary-only work, a slide deck, or a Word/PDF-only deliverable.
---

# Concept Atlas Dense Explain

Turn a topic or source document into semantic MDX and compile it with the `concept-atlas-dense-explain` CLI. Everything needed is in this file and the bundled `references/`; do not read the framework repository or installed package files, copy implementation files from the skill directory, or recreate the React/Vite app.

If the user only wants the methodology or MDX text, still choose one shell and emit valid MDX. CLI validation and compilation are needed only when producing files.

## Operating rules

- Use the CLI only through `npx`. Do not search for another runner or run the framework repository's own scripts.
- Use exactly one page shell per file. Keep MDX semantic: no CSS, SVG, custom React, or invented component APIs. Use free-position coordinates only when the user explicitly asks for manual layout.
- Preserve source claims, citations, counterexamples, and uncertainty. Never invent evidence, measurements, references, or examples to make a page look complete.
- Protect user files. `create`, `guide`, and compiled outputs overwrite their targets; `guide` also overwrites `assets/` beside its output. Choose a new path or ask before overwriting existing work.
- Load references by task instead of reading everything: component API, authoring, CLI details, and diagnostics are separate files.

## Workflow

1. **Establish the deliverable.** Identify the source material, audience, desired output path, and whether the user wants MDX only or compiled HTML. Ask only when a choice is ambiguous or would overwrite user work.
2. **Choose the shell.** Use the decision table below. If an `.mdx` file already exists, detect its shell and keep it unless conversion is requested.
3. **Learn the API before writing tags.** Read `references/components.md` and search it by component name. Unknown props are silently ignored, so do not guess. Use the matching bundled guide as a compilable example: `references/atlas-guide.mdx` or `references/scroll-guide.mdx`.
4. **Draft the semantic MDX.** Start from `create` when useful, then apply the authoring contract below. Read `references/authoring.md` for document conversion, source-to-component mapping, density checks, and stopping conditions.
5. **Validate before rendering.**
   ```bash
   npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll
   npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll --json
   ```
   Fix every error and re-run. Address warnings when cheap; use `--strict` when the user wants a clean structural contract. See `references/diagnostics.md` for causes and fixes.
6. **Compile.** Read `references/cli.md` for output, appearance, batching, and asset flags.
   ```bash
   npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll [-o out.html]
   ```
   Validation errors block the build. Use `--no-validate` only with an explicit reason.
7. **Verify the result.** Confirm the HTML exists. When a browser tool is available, open it and check the title, shell navigation, and every diagram, chart, figure, tab, or citation you added. Fix blank widgets or broken interactions; otherwise state what remains unverified.
8. **Report the outcome.** Name the shell, MDX and HTML paths, validation result, restructured/merged/dropped source material, and limitations that actually apply. Diagrams need no chart CDN, but fonts may load remotely and local images remain linked unless inlined. Do not claim interactions you did not verify.

## Shell decision

| Reader task | Shell | Structure |
| --- | --- | --- |
| Explore concepts, compare branches, follow relations | `atlas` | `ExplainPage` → `ConceptGraph` → `ConceptNode`, with `Children` / `ConceptRef` and cross-branch `Relation` |
| Read an argument, tutorial, procedure, or report in order | `scroll` | `ScrollDocument` → `ScrollHeader` + `ScrollSection`, with shared content components inside sections |
| Existing MDX | Detect and keep | Convert only the outer shell when requested; never combine both shells |

For `atlas`, keep exactly one `L0` root and use `L1`–`L4` for progressively finer detail. For `scroll`, the shell builds the table of contents and reading progress from section titles; do not hand-build navigation. Give `ExplainPage title` or `ScrollHeader title` a real static string because it becomes the browser tab title.

## Authoring contract

- Give each important concept a claim-like title, a one-sentence summary where the shell supports it, and substance that adds new information. Merge stubs instead of padding them.
- Density means information gain, not quotas. Cover what the concept is, why/how it works, evidence or an example when available, and a boundary or trade-off when relevant; stop when the reader's question is answered.
- Use `kind` only when an atlas node's knowledge role is clear. A `mechanism` should carry an `Invariant` or `Evidence`; a `failure` should carry a structured `FailureMode`.
- Use relation types for cross-branch meaning, never for parent-child hierarchy. Every `Relation` needs a meaningful `label`.
- Check array shapes in `components.md`. Pass LaTeX and code through the documented string/template-literal forms so MDX does not parse them as expressions.
- Always set figure `alt`; use `id` + `FigureRef` for automatic numbering. In `atlas`, keep `Cite` and `References` in the same node.
- Configure reading rhythm and text size on the shell, not with manual CSS.

## Reference router

| Need | Read |
| --- | --- |
| Component props, defaults, array shapes, aliases, traps | `references/components.md` |
| Document conversion, source fidelity, density, stopping conditions | `references/authoring.md` |
| Commands, flags, appearance, batching, assets, version mismatch | `references/cli.md` |
| Diagnostic meaning and repair action | `references/diagnostics.md` |
| Compilable composition examples | `references/atlas-guide.mdx` or `references/scroll-guide.mdx` |

## Failure recovery

- If `npx` cannot reach the registry, report the blocker; do not switch to a repository build or copy implementation files.
- If the CLI rejects a component that the current skill documents, check `--version` and report a likely skill/CLI version mismatch rather than inventing a workaround.
- If validation still fails after the documented fix, report the remaining diagnostic and the file location instead of using `--no-validate` silently.
