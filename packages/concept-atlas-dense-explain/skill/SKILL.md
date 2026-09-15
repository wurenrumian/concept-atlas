---
name: concept-atlas-dense-explain
description: Use the Concept Atlas npm CLI to generate AI-editable MDX starters and compile standalone HTML from semantic MDX when a technical explanation, concept map, layered knowledge page, or interactive explanation is requested.
---

# Concept Atlas Dense Explain

Use the `concept-atlas-dense-explain` npm CLI. This skill is intentionally lightweight: do not copy implementation files from the skill directory or recreate the React/Vite application manually.

## Workflow

1. Choose the page shell before writing MDX. `atlas` uses a concept graph with node navigation; `scroll` uses a continuous document flow. The component library is shared: information-density components such as `Insight`, `Flow`, `FrameworkModel`, `MatrixModel`, `Mermaid`, `RelationMap`, `NoteGrid`, `Callout`, `Details`, `Columns`, `Grid`, `Stack`, and `Tabs` can be used wherever their meaning fits. Recommend `atlas` when the reader needs concept navigation or a relation graph; recommend `scroll` for a conventional reading flow.
2. When a starting point is useful, create a single MDX file with `npx concept-atlas-dense-explain create <file>.mdx --mode atlas|scroll`, then rewrite it with the AI.
3. For B, write semantic MDX to the user-selected `.mdx` file. Include one `L0`, multiple `L1` branches, useful depth, `Children`/`ConceptRef`, and labeled `Relation`s. This content renders through the interactive atlas entry.
4. For `scroll`, use `ScrollDocument`, `ScrollHeader`, `ScrollSection`, `ScrollProse`, and `ScrollGrid` as the document shell. Put shared information components inside sections as needed.
5. For `atlas`, use `ExplainPage`, `ConceptGraph`, `ConceptNode`, `Children`, `ConceptRef`, and `Relation` as the graph shell. Put shared information components inside nodes as needed.
6. Do not force one MDX file to be both page shells. This is a shell distinction, not a component-library distinction; convert only the outer structure when changing carriers.
7. Compile directly with `npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll`. The output is a standalone `.html` beside the MDX unless `-o` is provided. The mode can be detected from the top-level carrier, but specify it when the file is ambiguous.
8. Report the selected mode, output path, and limitations. Do not claim interactions that were not verified.

## Content rules

- Keep MDX semantic; do not write CSS, coordinates, SVG, or replacement application code.
- Give important nodes a claim-like title, a one-sentence summary, evidence, and meaningful components.
- Treat the built-in component library as shared across carriers; choose components by the relationship they express, not by the page shell.
- Keep the outer shell valid for the selected carrier and keep component props valid; the renderer does not convert arbitrary JSX or CSS into a semantic component automatically.
- For array props, use the documented object shapes: `Flow.steps` accepts strings or `{ title, description }`, `Timeline.events` uses `{ label, content }`, table rows use `string[][]`, and model data uses arrays of named objects.
- For continuous reading, configure spacing on the shell with `ScrollDocument spacing="compact|comfortable|airy"`; use `ScrollSection spacing="..."` only for a local override instead of adding manual margins.
- If the CLI or npm registry is unavailable, report the blocker instead of copying the implementation into the skill.
