---
name: concept-atlas-dense-explain
description: Use the Concept Atlas npm CLI to create and build structured explanation webpages when a technical explanation, concept map, layered knowledge page, or interactive explanation is requested.
---

# Concept Atlas Dense Explain

Use the `concept-atlas-dense-explain` npm CLI. This skill is intentionally lightweight: do not copy implementation files from the skill directory or recreate the React/Vite application manually.

## Workflow

1. Choose the carrier before writing any MDX. A (continuous reading) uses a document-flow MDX structure; B (interactive Concept Atlas) uses a concept-graph MDX structure. Recommend B when the reader needs concept navigation or a relation graph; recommend A for a conventional HTML reading flow with denser horizontal component grids.
2. Initialize a project with `npx concept-atlas-dense-explain init <target>`. Use `--force` only when replacing existing template files is explicitly acceptable.
3. For B, write semantic MDX to `<target>/content/compile-runtime.mdx`. Include one `L0`, multiple `L1` branches, useful depth, `Children`/`ConceptRef`, and labeled `Relation`s. This content renders through the interactive atlas entry.
4. For A, write semantic MDX to `<target>/content/scroll-reading-demo.mdx` with `ScrollDocument`, `ScrollHeader`, `ScrollSection`, `ScrollProse`, and `ScrollGrid`. Do not wrap it in `ExplainPage`, `ConceptGraph`, or `ConceptNode`. This content renders through the continuous-reader entry.
5. Do not try to make one MDX file serve both carriers. The template ships both sample entries for reference, but they represent distinct authoring formats.
6. Build with `npx concept-atlas-dense-explain build <target> --mode atlas` or `--mode scroll` to create only the selected carrier. Without `--mode`, the CLI builds both template examples. The outputs are `<target>/dist/index.html` (interactive atlas) and `<target>/dist/scroll.html` (standalone continuous reader).
7. Report the selected mode, output path, and limitations. Do not claim interactions that were not verified.

## Content rules

- Keep MDX semantic; do not write CSS, coordinates, SVG, or replacement application code.
- Give important nodes a claim-like title, a one-sentence summary, evidence, and meaningful components.
- Use only components and relation types supported by the initialized template.
- If the CLI or npm registry is unavailable, report the blocker instead of copying the implementation into the skill.
