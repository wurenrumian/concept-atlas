---
name: concept-atlas-dense-explain
description: Turn a topic or an existing document into an interactive Concept Atlas explainer. Use the concept-atlas-dense-explain npm CLI to generate AI-editable MDX, validate its structure, and compile standalone HTML with concept nodes, relation graphs, math (KaTeX), charts, figures, citations, and reading aids. Use when a technical explanation, concept map, layered knowledge page, dense explainer, or interactive teaching page is requested.
---

# Concept Atlas Dense Explain

Drive everything through the `concept-atlas-dense-explain` npm CLI. This skill is intentionally lightweight: do not copy implementation files from the skill directory and do not recreate the React/Vite app. If a command name is unclear, run `npx concept-atlas-dense-explain help`.

If the user only wants the prompt/methodology and not files, still choose a shell and emit valid MDX; the CLI is needed only to compile.

## Workflow

1. Choose one page shell: `atlas` (concept graph with node navigation) or `scroll` (continuous document). Recommend `atlas` when the reader needs to drill into concepts or see relations; recommend `scroll` for linear argument, tutorials, and reports. The component library is shared. If the user already has an `.mdx` file, detect its shell and work with it.
2. **Learn the components from the canonical guide before authoring.** Generate the guide for the chosen shell into a temporary path and read it:
   ```bash
   npx concept-atlas-dense-explain guide --mode atlas -o ./concept-atlas-atlas-guide.mdx
   npx concept-atlas-dense-explain guide --mode scroll -o ./concept-atlas-scroll-guide.mdx
   ```
   It is a real, compilable MDX file demonstrating every component and its exact props. Search it for a component name to copy the correct prop shape instead of guessing. Delete it when done.
3. Start from a skeleton when useful: `npx concept-atlas-dense-explain create <file>.mdx --mode atlas|scroll`. `create` and `guide` refuse to overwrite an existing file unless `--force` is passed.
4. Write the semantic MDX into the user's `.mdx` file (see Authoring rules).
5. Validate before rendering:
   ```bash
   npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll
   npx concept-atlas-dense-explain validate <file>.mdx --json
   ```
   Every diagnostic is `CODE line:column message`. Fix all `error`s and re-run; warnings are quality signals you should also address when cheap.
6. Compile: `npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll [-o out.html]`. Output is a standalone HTML beside the MDX unless `-o` is given. Validation errors abort the build; use `--no-validate` only to force a knowingly broken build.
7. Report the shell, output path, validation result (errors/warnings), and limitations. Do not claim interactions you did not verify.

## Carriers

- `atlas`: `ExplainPage` → `ConceptGraph` → `ConceptNode`, plus `Children`/`ConceptRef` and cross-branch `Relation`s. Exactly one `L0` root, several `L1` branches, depth to `L3`/`L4`. Shared components live inside nodes.
- `scroll`: `ScrollDocument` → `ScrollHeader` + `ScrollSection` (+ `ScrollProse`, `ScrollGrid`). Shared components live inside sections. The shell auto-builds a a table of contents and reading progress from section titles — do not hand-build navigation.
- Never make one MDX file both shells. When switching shells, convert only the outer structure.

## Component families

- Node semantics: `Overview`, `Definition`, `Mechanism`, `Implementation`, `Boundary`, `Example`, `Counterexample`, `Prerequisite`, `Input`, `Output`, `Glossary`
- Argument and evidence: `Evidence`, `Invariant`, `FailureMode`, `Tradeoff`, `LearningObjectives`, `KeyQuestion`
- Information models: `Flow`, `Timeline`, `Compare`, `DecisionMatrix`, `FrameworkModel`, `MatrixModel`, `FormulaModel`, `PyramidModel`, `FunnelModel`
- Reading and layout: `Insight`, `Callout`, `Details`, `NoteGrid`, `Tabs`, `Columns`, `Stack`, `Grid`, `Split`, `ScrollGrid`
- Graphics and extensions: `Mermaid`, `RelationMap`, `RelationPath`, `Math`, `MathBlock`, `Chart`, `Figure`, `Cite`, `References`

## Authoring rules

- Keep MDX semantic. Never write CSS, coordinates, SVG, or replacement application code; never invent component names or props.
- Give each important node a claim-like title, a one-sentence `summary`, and real substance (`Definition`, `Mechanism`, `Example`, `Boundary`, `Evidence`, a model, a chart, or math). Do not restate the same text across `Overview`, `Definition`, and `Insight`.
- Array props are arrays of objects: `Flow steps={[{title, description}]}`, `Timeline events={[{label, content}]}`, `MatrixModel cells={[{title, description, tone}]}`, `DecisionMatrix headers={[...]} rows={[[...]]}`, `Chart data={[{label, value}]}`, `References items={[{id, authors, year, title, url, source}]}`. The validator warns (`PROP_EXPECTS_ARRAY`) when an array prop gets a string or non-array.
- `Relation type` must be one of `prerequisite`, `causes`, `produces`, `uses`, `implements`, `contrasts`, `depends-on`, `exception-of`, `precedes`, and each `Relation` needs a `label`. Parent/child hierarchy is implicit (via `parent` and `Children`/`ConceptRef`) — do not express it with a `Relation`.
- **Math**: MDX parses `{ ... }` in children as expressions, so pass LaTeX with braces or backslashes through `formula`: `<Math formula="r_{\text{ann}} = (1 + r)^{12} - 1" />`, `<MathBlock formula="I(x) = -\log_2 p(x)" variables={[{symbol, description}]} />`. Brace-free children such as `<Math>\log_2 N</Math>` are fine. The validator warns (`MATH_CHILDREN_BRACES`).
- **Chart**: `type` is `bar` | `line` | `pie`; use `data` for bar/pie and `labels` + `series={[{name, values}]}` for line. Charts follow theme colors.
- **Figure**: a relative `src` (`./assets/diagram.png`) is inlined as base64 at build time so the HTML stays standalone; `http(s)` URLs stay links. Always set `alt`; add `label` and `caption` for a numbered caption. A missing relative file produces an `ASSET_MISSING` warning and a placeholder.
- **Cite/References**: `<Cite id="..." />` renders `[n]` from the matching item's position in `<References items={...} />`. In `scroll`, `References` can sit anywhere. In `atlas`, keep the cites and the `References` block in the same node, because node content only renders when that node is open.
- Continuous reading is configured on the shell, not with manual CSS: `spacing="compact|comfortable|airy"` for rhythm, `fontSize="compact|normal|large|xlarge"` (or numeric `scale`/`lineHeight`) for text size.
- Be brief about cost: KaTeX fonts and Mermaid roughly double the single-file output (~5 MB), which is normal for an offline explainer. Mention it if the user cares about file size.

## Validation diagnostics

`validate` and the build print `CODE line:column message`. Fix these `error`s before building: `UNKNOWN_COMPONENT`, `CARRIER_MISSING`, `CARRIER_CONFLICT`, `CARRIER_MODE_MISMATCH`, `NODE_MISSING_ID`, `DUPLICATE_NODE_ID`, `NODE_MISSING_TITLE`, `MISSING_PARENT`, `GRAPH_ROOT_UNRESOLVED`, `REF_UNRESOLVED`, `RELATION_FROM_UNRESOLVED`, `RELATION_TO_UNRESOLVED`. Warnings worth fixing: `NODE_MISSING_SUMMARY`, `NODE_NO_CORE_CONTENT`, `UNKNOWN_LEVEL`, `UNKNOWN_RELATION_TYPE`, `RELATION_MISSING_LABEL`, `PROP_EXPECTS_ARRAY`, `MATH_CHILDREN_BRACES`, `GRAPH_MISSING_ROOT`, `ASSET_MISSING`.

## Before you report

- All `error` diagnostics resolved (or `--no-validate` explicitly justified).
- All `ConceptRef`, `Relation` endpoints, and `ConceptGraph root` point at existing node ids.
- Every node has `title` + `summary`; every `Relation` has a `label`.
- The HTML file exists at the reported path.

If the CLI or npm registry is unavailable, report the blocker instead of copying the implementation into the skill.
