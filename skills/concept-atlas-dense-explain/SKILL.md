---
name: concept-atlas-dense-explain
description: Turn a topic or an existing document into an interactive Concept Atlas explainer. Generate AI-editable MDX with the concept-atlas-dense-explain CLI, validate its structure, and compile standalone HTML with concept nodes, relation graphs, math (KaTeX), charts, figures, citations, and reading aids. Use when a technical explanation, concept map, layered knowledge page, dense explainer, or interactive teaching page is requested.
---

# Concept Atlas Dense Explain

Drive everything through the `concept-atlas-dense-explain` CLI, always via `npx`. Everything you need is in this file and the bundled `references/`; do not read the framework repository or installed package files, do not copy implementation files from the skill directory, and do not recreate the React/Vite app. If a command name is unclear, run `npx concept-atlas-dense-explain help`. If the user only wants the prompt/methodology and not files, still choose a shell and emit valid MDX; the CLI is needed only to validate and compile.

## Running the CLI

Always invoke the CLI through `npx`, from any directory:

```bash
npx concept-atlas-dense-explain <args>
```

This is the only runner — there is nothing to look for. Do not search for a local binary, a repository checkout, or an installed copy, and do not run the framework's own `npm` scripts. The first call downloads the package from the npm registry; say so once, then continue.

## Workflow

1. Choose one page shell: `atlas` (concept graph with node navigation) or `scroll` (continuous document). Recommend `atlas` when the reader drills into concepts or follows relations, `scroll` for linear argument, tutorials, and reports. The library is shared. If an `.mdx` already exists, detect its shell and work with it.
2. **Learn the components from the bundled reference before authoring.** The only reference you need is the guide that ships with this skill:
   - `references/atlas-guide.mdx` (atlas) or `references/scroll-guide.mdx` (scroll)
   It is real, compilable MDX showing that shell's components and their exact props; search it for a component name instead of guessing, and do not look for component documentation anywhere else. Do not run `guide` for this.
   Run `npx concept-atlas-dense-explain guide --mode <mode> -o <file>` only when you specifically need a project-local copy to compile beside the page, and delete that copy when done.
3. Start from a skeleton when useful: `npx concept-atlas-dense-explain create <file>.mdx --mode atlas|scroll`. `create` and `guide` refuse to overwrite an existing file unless `--force` is passed.
4. Write the semantic MDX into the user's `.mdx` file (see Authoring rules).
5. Validate before rendering:
   ```bash
   npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll
   npx concept-atlas-dense-explain validate <file>.mdx --json
   ```
   Diagnostics are `CODE line:column message`. Fix all `error`s and re-run; address warnings when cheap.
6. Compile: `npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll [-o out.html] [--skin <id>] [--default-mode dark|light|system] [--style <id>] [--inline-mermaid] [--mermaid-cdn <url>]`. Output is a standalone HTML beside the MDX unless `-o` is given. Validation errors abort the build (`--no-validate` forces a knowingly broken build). Mermaid loads from a CDN at runtime by default (needs network); pass `--inline-mermaid` for a fully offline single file.
7. **Appearance (optional)**: pages ship a reader-facing appearance menu — palette (`aurora` indigo, `ember` gold, `verdant` forest, `sakura` pink-plum, `noir` ink), a dark/light toggle, and a component style pack (`manuscript` editorial marginalia, `classic` boxed cards, `shadcn` hairline-bordered minimal UI, `elastic` bordered observability panels). The shipped default is aurora × manuscript × light; choices persist in localStorage across both carriers. Bake different compile-time defaults with `--skin ember --default-mode dark --style classic` (or `CONCEPT_ATLAS_SKIN` / `CONCEPT_ATLAS_DEFAULT_MODE` / `CONCEPT_ATLAS_STYLE` on the repo build); `--default-mode` honors `dark`/`light` and resolves `system` to the carrier default (`light`). Bake a default only when the user asks for one — content MDX never sets appearance.
8. For several documents, pass them all in one call: `npx concept-atlas-dense-explain a.mdx b.mdx c.mdx -o dist --force [--concurrency 3]` (`-o` is then a directory; everything validates first, then builds in parallel). Builds bundle only the heavy renderers the content uses: no `<Math>` skips KaTeX's ~1.4MB inlined fonts, and Mermaid stays on a CDN. Never add dummy `<Math>`/`<Mermaid>` nodes to "enable" them.
9. Report the shell, output path, validation result (errors/warnings), and limitations. Do not claim interactions you did not verify.

## Carriers

- `atlas`: `ExplainPage` → `ConceptGraph` → `ConceptNode`, plus `Children`/`ConceptRef` and cross-branch `Relation`s. Exactly one `L0` root, several `L1` branches, depth to `L3`/`L4`. Shared components live inside nodes. `ConceptNode` also takes an optional `kind` (see Authoring rules) that labels a node's knowledge role independently of its level.
- `scroll`: `ScrollDocument` → `ScrollHeader` + `ScrollSection` (+ `ScrollProse`, `ScrollGrid`). Shared components live inside sections. The shell auto-builds a table of contents and reading progress from section titles — do not hand-build navigation.
- The browser tab comes from the shell, not the build flags: `ExplainPage title` (atlas) or `ScrollHeader title` (scroll) becomes the `<title>`, so give it a real, specific name — never a placeholder like "主题名称". Every page uses a fixed 📃 favicon.
- Never make one MDX file both shells. When switching shells, convert only the outer structure.

## Component families

- Node semantics: `Overview`, `Definition`, `Mechanism`, `Implementation`, `CodeBlock`, `Boundary`, `Example`, `Counterexample`, `Prerequisite`, `Input`, `Output`, `Glossary`
- Argument and evidence: `Evidence`, `Invariant`, `FailureMode`, `Tradeoff`, `LearningObjectives`, `KeyQuestion`
- Learning loop and provenance: `WorkedExample` + `Step`, `Quiz`, `KeyTakeaways`, `Source`, `Confidence`, `Term`
- Information models: `Flow`, `Timeline`, `Compare`, `DecisionMatrix`, `FrameworkModel`, `MatrixModel`, `FormulaModel`, `PyramidModel`, `FunnelModel`
- Data and behaviour: `DataTable`, `Metric`, `StateMachine`, `DecisionTree`, `FeedbackLoop`, `CodeDiff`
- Reading and layout: `Insight`, `Callout`, `Details`, `NoteGrid`, `Tabs`, `Columns`, `Stack`, `Grid`, `Split`, `ScrollGrid`, `ScrollPair`, `ScrollToc`
- Graphics and extensions: `Mermaid`, `RelationMap`, `RelationPath`, `Math`, `MathBlock`, `Chart`, `Figure` (alias `Image`), `Cite`, `References`

## Authoring rules

- Keep MDX semantic. Never write CSS, coordinates, SVG, or replacement application code; never invent component names or props.
- Give each important node a claim-like title, a one-sentence `summary`, and real substance (`Definition`, `Mechanism`, `Example`, `Boundary`, `Evidence`, a model, a chart, or math). Do not restate the same text across `Overview`, `Definition`, and `Insight`.
- **`kind` (optional, atlas)**: tag a node's knowledge role independently of `level`. One of `system`, `stage`, `mechanism`, `artifact`, `failure`, `tool`, `boundary`, `decision`. It powers the graph's "知识类型" filter and a node badge, so use it where the role is clear rather than on every node. Two opt-in contracts fire once you declare one: `kind="mechanism"` should contain an `Invariant` or `Evidence`, and `kind="failure"` should contain a `FailureMode` (with `symptom`/`cause`/`evidence`/`remedy`).
- Array props are arrays of objects: `Flow steps={[{title, description}]}`, `Timeline events={[{label, content}]}`, `MatrixModel cells={[{title, description, tone}]}`, `DecisionMatrix headers={[...]} rows={[[...]]}`, `Chart data={[{label, value}]}`, `References items={[{id, authors, year, title, url, source}]}`. The validator warns (`PROP_EXPECTS_ARRAY`) when an array prop gets a string or non-array.
- `Relation type` must be one of `prerequisite`, `causes`, `produces`, `uses`, `implements`, `contrasts`, `depends-on`, `exception-of`, `precedes`, and each `Relation` needs a `label`. Parent/child hierarchy is implicit (via `parent` and `Children`/`ConceptRef`) — do not express it with a `Relation`.
- **Math**: MDX parses `{ ... }` in children as expressions, so pass LaTeX with braces or backslashes through `formula`: `<Math formula="r_{\text{ann}} = (1 + r)^{12} - 1" />`, `<MathBlock formula="I(x) = -\log_2 p(x)" variables={[{symbol, description}]} />`. Brace-free children such as `<Math>\log_2 N</Math>` are fine. The validator warns (`MATH_CHILDREN_BRACES`).
- **CodeBlock**: a general code block usable anywhere; `Implementation` is the node-bound variant. Pass the code as a string via `code` (or as children) wrapped in a template literal so MDX does not read it as expressions: `<CodeBlock language="bash" title="..." lineNumbers>{`npm run validate`}</CodeBlock>`. `language` adds the badge, `title`/`caption` add labels, `lineNumbers` and `wrap` are booleans.
- **Chart**: `type` is `bar` | `line` | `pie`; use `data` for bar/pie and `labels` + `series={[{name, values}]}` for line. Charts follow theme colors.
- **Learning loop**: `WorkedExample` holds `Step` children; give each step a `reason` (the justification) so it teaches reasoning, not just the result. `Quiz question answer` reveals the answer on click with children as the explanation. `KeyTakeaways items={[...]}` closes a section.
- **Provenance**: `Source kind="spec|rfc|implementation|experiment|experience" label href` marks one claim's origin inline; `Confidence level="high|medium|low" basis` wraps a claim with how strongly it is established; `Term name` (or children as the definition) gives an inline hover definition.
- **Data and behaviour**: `DataTable headers={[...]} rows={[[...]]}` is the neutral table (no comparative stance). `Metric label value unit delta trend note` is one headline number — compose several with `Grid`/`ScrollGrid`. `StateMachine states={[{id,label,terminal}]} transitions={[{from,to,event,guard}]}` expresses cycles and guards. `DecisionTree branches={[{condition,outcome,tone,branches}]}` nests branches. `FeedbackLoop type="reinforcing|balancing" nodes={[{label,description}]}` closes a loop. `CodeDiff before after language` shows a change.
- **Figure**: a relative `src` (`./assets/diagram.png`) is inlined as base64 at build time so the HTML stays standalone; `http(s)` URLs stay links. Always set `alt`; add `label` and `caption` for a numbered caption. A missing relative file warns (`ASSET_MISSING`) and shows a placeholder. Readers can click a figure to open it full-screen (zoom, drag, `Esc`) — mention it for diagram-heavy pages.
- **Figure size & cost**: inlining images is what makes a screenshot-heavy page large; a page with no heavy renderers otherwise lands near 250KB. When the user cares, compile with `--link-assets` to keep images as relative links (measured 1.51MB → 270KB); the output must then sit beside the MDX's `assets/`, and the CLI warns if `-o` points elsewhere — tell the user that trade-off instead of choosing silently.
- **Cite/References**: `<Cite id="..." />` renders `[n]` from the matching item's position in `<References items={...} />`. In `scroll`, `References` can sit anywhere. In `atlas`, keep the cites and the `References` block in the same node, because node content only renders when that node is open.
- Continuous reading is configured on the shell, not with manual CSS: `spacing="compact|comfortable|airy"` for rhythm, `fontSize="compact|normal|large|xlarge"` (or numeric `scale`/`lineHeight`) for text size.

## Validation diagnostics

`validate` and the build print `CODE line:column message`. Fix these `error`s before building: `UNKNOWN_COMPONENT`, `CARRIER_MISSING`, `CARRIER_CONFLICT`, `CARRIER_MODE_MISMATCH`, `NODE_MISSING_ID`, `DUPLICATE_NODE_ID`, `NODE_MISSING_TITLE`, `MISSING_PARENT`, `GRAPH_ROOT_UNRESOLVED`, `REF_MISSING_ID`, `REF_UNRESOLVED`, `RELATION_FROM_UNRESOLVED`, `RELATION_TO_UNRESOLVED`. Warnings worth fixing: `NODE_MISSING_SUMMARY`, `NODE_NO_CORE_CONTENT`, `UNKNOWN_LEVEL`, `UNKNOWN_KIND`, `MECHANISM_KIND_UNVERIFIED`, `FAILURE_KIND_UNSTRUCTURED`, `FAILURE_MODE_EMPTY`, `UNKNOWN_RELATION_TYPE`, `RELATION_MISSING_LABEL`, `RELATION_SELF`, `PROP_EXPECTS_ARRAY`, `MATH_CHILDREN_BRACES`, `PROSE_EXPRESSION`, `FRONTMATTER_UNSUPPORTED`, `GRAPH_MISSING_ROOT`, `FIGURE_MISSING_SRC`, `ASSET_MISSING`, `REF_SELF`; `NO_ROOT_LEVEL`, `MULTIPLE_ROOT_LEVEL`, `MECHANISM_KIND_UNVERIFIED` and `FAILURE_KIND_UNSTRUCTURED` are warnings that `--strict` promotes to errors.

## Before you report

- All `error` diagnostics resolved (or `--no-validate` explicitly justified).
- All `ConceptRef`, `Relation` endpoints, and `ConceptGraph root` point at existing node ids.
- Every node has `title` + `summary`; every `Relation` has a `label`.
- The HTML file exists at the reported path.

If `npx` cannot reach the registry, report the blocker. Never copy implementation files into the skill directory.
