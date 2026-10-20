---
name: concept-atlas-dense-explain
description: Turn a topic or existing document into an interactive Concept Atlas explainer — AI-editable MDX compiled to standalone HTML with concept nodes, relation graphs, math, charts, figures, citations, and reading aids. Use for technical explanations, concept maps, layered knowledge pages, dense explainers, or interactive teaching pages; also 概念图 / 知识地图 / 分层讲解.
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
2. **Learn the components before authoring.** `references/components.md` is the catalogue — search it by component name for props and shapes rather than guessing. `references/atlas-guide.mdx` (atlas) or `references/scroll-guide.mdx` (scroll) is real, compilable MDX showing how that shell's components compose into a page. Do not look for component documentation anywhere else, and do not run `guide` for this.
   Run `npx concept-atlas-dense-explain guide --mode <mode> -o <file>` only when you specifically need a project-local copy to compile beside the page, and delete that copy when done.
3. Start from a skeleton when useful: `npx concept-atlas-dense-explain create <file>.mdx --mode atlas|scroll` (`--mode` defaults to `scroll`). `create` and `guide` overwrite their output, so never point them at a file you want to keep.
4. Write the semantic MDX into the user's `.mdx` file (see Authoring rules).
5. Validate before rendering:
   ```bash
   npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll
   npx concept-atlas-dense-explain validate <file>.mdx --json
   ```
   Diagnostics are `CODE line:column message`. Fix all `error`s and re-run; address warnings when cheap.
6. Compile: `npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll [-o out.html] [--skin <id>] [--default-mode dark|light|system] [--style <id>]`. Output is a standalone HTML beside the MDX unless `-o` is given. Validation errors abort the build (`--no-validate` forces a knowingly broken build). `<Mermaid>` charts are rendered by Pele and inline into the HTML, so the page is a fully offline single file with no CDN call — no flag needed.
7. **Appearance (optional)**: pages ship a reader-facing appearance menu — palette (`aurora` indigo, `ember` gold, `verdant` forest, `sakura` pink-plum, `noir` ink), a dark/light toggle, and a component style pack (`manuscript` editorial marginalia, `classic` boxed cards, `shadcn` hairline-bordered minimal UI, `elastic` bordered observability panels). The shipped default is aurora × manuscript × light; choices persist in localStorage across both carriers. Bake different compile-time defaults with `--skin ember --default-mode dark --style classic` (or `CONCEPT_ATLAS_SKIN` / `CONCEPT_ATLAS_DEFAULT_MODE` / `CONCEPT_ATLAS_STYLE` on the repo build); `--default-mode` honors `dark`/`light` and resolves `system` to the carrier default (`light`). Bake a default only when the user asks for one — content MDX never sets appearance.
8. For several documents, pass them all in one call: `npx concept-atlas-dense-explain a.mdx b.mdx c.mdx -o dist [--concurrency 3]` (`-o` is then a directory; everything validates first, then builds in parallel). Builds bundle only the renderers the content uses: no `<Math>` skips KaTeX's ~1.4MB inlined fonts, and no `<Mermaid>` drops Pele entirely. Never add dummy `<Math>`/`<Mermaid>` nodes to "enable" them.
9. Report the shell, output path, validation result (errors/warnings), and limitations. Do not claim interactions you did not verify.

## Carriers

- `atlas`: `ExplainPage` → `ConceptGraph` → `ConceptNode`, plus `Children`/`ConceptRef` and cross-branch `Relation`s. Exactly one `L0` root, several `L1` branches, depth to `L3`/`L4`. Shared components live inside nodes. `ConceptNode` also takes an optional `kind` (see Authoring rules) that labels a node's knowledge role independently of its level.
- `scroll`: `ScrollDocument` → `ScrollHeader` + `ScrollSection` (+ `ScrollProse`, `ScrollGrid`). Shared components live inside sections. The shell auto-builds a table of contents and reading progress from section titles — do not hand-build navigation.
- The browser tab comes from the shell, not the build flags: `ExplainPage title` (atlas) or `ScrollHeader title` (scroll) becomes the `<title>`, so give it a real, specific name — never a placeholder like "主题名称". Every page uses a fixed 📃 favicon.
- Never make one MDX file both shells. When switching shells, convert only the outer structure.

## Component and prop reference

The component catalogue, every prop shape, and the syntax traps are in `references/components.md`. Read it before authoring, and search it by component name whenever a tag is new to this page — prop names and shapes are not guessable. Charts, the learning loop, provenance, data/behaviour and structure components are documented there in full; only the rules that must hold on every page are repeated below.

## Authoring rules

- Keep MDX semantic. Never write CSS, coordinates, SVG, or replacement application code; never invent component names or props.
- Give each important node a claim-like title, a one-sentence `summary`, and real substance (`Definition`, `Mechanism`, `Example`, `Boundary`, `Evidence`, a model, a chart, or math). Do not restate the same text across `Overview`, `Definition`, and `Insight`.
- **`kind` (optional, atlas)**: tag a node's knowledge role independently of `level`. One of `system`, `stage`, `mechanism`, `artifact`, `failure`, `tool`, `boundary`, `decision`. It powers the graph's "知识类型" filter and a node badge, so use it where the role is clear rather than on every node. Two opt-in contracts fire once you declare one: `kind="mechanism"` should contain an `Invariant` or `Evidence`, and `kind="failure"` should contain a `FailureMode` (with `symptom`/`cause`/`evidence`/`remedy`).
- Array props are arrays of objects: `Flow steps={[{title, description}]}`, `Timeline events={[{label, content}]}`, `MatrixModel cells={[{title, description, tone}]}`, `DecisionMatrix headers={[...]} rows={[[...]]}`, `Chart data={[{label, value}]}`, `References items={[{id, authors, year, title, url, source}]}`. The validator warns (`PROP_EXPECTS_ARRAY`) when an array prop gets a string or non-array.
- `Relation type` must be one of `prerequisite`, `causes`, `produces`, `uses`, `implements`, `contrasts`, `depends-on`, `exception-of`, `precedes`, and each `Relation` needs a `label`. Parent/child hierarchy is implicit (via `parent` and `Children`/`ConceptRef`) — do not express it with a `Relation`.
- **Math**: MDX parses `{ ... }` in children as expressions, so pass LaTeX with braces or backslashes through `formula`: `<Math formula="r_{\text{ann}} = (1 + r)^{12} - 1" />`, `<MathBlock formula="I(x) = -\log_2 p(x)" variables={[{symbol, description}]} />`. Brace-free children such as `<Math>\log_2 N</Math>` are fine. The validator warns (`MATH_CHILDREN_BRACES`).
- **Code**: pass code as a string via `code` (or as children) wrapped in a template literal, so MDX does not read it as expressions: `<CodeBlock language="bash" lineNumbers>{`npm run validate`}</CodeBlock>`. Badges, captions and wrapping are documented in `references/components.md`.
- **Figures**: always set `alt`; number with an `id` plus `<FigureRef>`, never hand-write "图 N"; relative links versus `--inline-assets` is a size trade-off — decide it with the user instead of choosing silently.
- **Cite/References**: `<Cite id="..." />` renders `[n]` from the matching item's position in `<References items={...} />`. In `atlas`, keep the cites and the `References` block in the same node, because node content only renders when that node is open.
- Continuous reading is configured on the shell, not with manual CSS: `spacing="compact|comfortable|airy"` for rhythm, `fontSize="compact|normal|large|xlarge"` (or numeric `scale`/`lineHeight`) for text size.

## Validation diagnostics

`validate` and the build print `CODE line:column message`. Fix every `error` before building; `references/diagnostics.md` lists the codes you may meet and separates errors from warnings. `NO_ROOT_LEVEL`, `MULTIPLE_ROOT_LEVEL`, `MECHANISM_KIND_UNVERIFIED` and `FAILURE_KIND_UNSTRUCTURED` are warnings that `--strict` promotes to errors.

## Before you report

- All `error` diagnostics resolved (or `--no-validate` explicitly justified).
- All `ConceptRef`, `Relation` endpoints, and `ConceptGraph root` point at existing node ids.
- Every node has `title` + `summary`; every `Relation` has a `label`.
- Pages with `<Mermaid>` are already fully offline: Pele ships inline, so you never need a CDN flag.
- The HTML file exists at the reported path.

If `npx` cannot reach the registry, report the blocker. Never copy implementation files into the skill directory.
