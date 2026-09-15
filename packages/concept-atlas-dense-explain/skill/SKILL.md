---
name: concept-atlas-dense-explain
description: Use the Concept Atlas npm CLI to generate AI-editable MDX starters and compile standalone HTML from semantic MDX when a technical explanation, concept map, layered knowledge page, or interactive explanation is requested.
---

# Concept Atlas Dense Explain

Use the `concept-atlas-dense-explain` npm CLI. This skill is intentionally lightweight: do not copy implementation files from the skill directory or recreate the React/Vite application manually.

## Workflow

1. Choose the carrier before writing any MDX. A (continuous reading) uses a document-flow MDX structure; B (interactive Concept Atlas) uses a concept-graph MDX structure. Recommend B when the reader needs concept navigation or a relation graph; recommend A for a conventional HTML reading flow with denser horizontal component grids.
2. When a starting point is useful, create a single MDX file with `npx concept-atlas-dense-explain create <file>.mdx --mode atlas|scroll`, then rewrite it with the AI.
3. For B, write semantic MDX to the user-selected `.mdx` file. Include one `L0`, multiple `L1` branches, useful depth, `Children`/`ConceptRef`, and labeled `Relation`s. This content renders through the interactive atlas entry.
4. For A, write semantic MDX to the user-selected `.mdx` file with `ScrollDocument`, `ScrollHeader`, `ScrollSection`, `ScrollProse`, and `ScrollGrid`. Do not wrap it in `ExplainPage`, `ConceptGraph`, or `ConceptNode`. This content renders through the continuous-reader entry.
5. Do not try to make one MDX file serve both carriers. The template ships both sample entries for reference, but they represent distinct authoring formats.
6. Compile directly with `npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll`. The output is a standalone `.html` beside the MDX unless `-o` is provided. The mode can be detected from the top-level carrier, but specify it when the file is ambiguous.
7. Report the selected mode, output path, and limitations. Do not claim interactions that were not verified.

## Content rules

- Keep MDX semantic; do not write CSS, coordinates, SVG, or replacement application code.
- Give important nodes a claim-like title, a one-sentence summary, evidence, and meaningful components.
- Use only components and relation types supported by the built-in renderer.
- If the CLI or npm registry is unavailable, report the blocker instead of copying the implementation into the skill.
