---
name: concept-atlas-dense-explain
description: Use the Concept Atlas npm CLI to create and build structured explanation webpages when a technical explanation, concept map, layered knowledge page, or interactive explanation is requested.
---

# Concept Atlas Dense Explain

Use the `concept-atlas-dense-explain` npm CLI. This skill is intentionally lightweight: do not copy implementation files from the skill directory or recreate the React/Vite application manually.

## Workflow

1. Ask whether the user wants A (scrollable component page) or B (interactive Concept Atlas) unless already specified. Recommend B when they have no preference.
2. Initialize a project with `npx concept-atlas-dense-explain init <target>`. Use `--force` only when replacing existing template files is explicitly acceptable.
3. Write semantic MDX to `<target>/content/compile-runtime.mdx`. For B, include one `L0`, multiple `L1` branches, useful depth, `Children`/`ConceptRef`, and labeled `Relation`s.
4. Build with `npx concept-atlas-dense-explain build <target>`. The CLI installs template dependencies when needed, validates content, and writes `<target>/dist/index.html`.
5. Report the selected mode, output path, and limitations. Do not claim interactions that were not verified.

## Content rules

- Keep MDX semantic; do not write CSS, coordinates, SVG, or replacement application code.
- Give important nodes a claim-like title, a one-sentence summary, evidence, and meaningful components.
- Use only components and relation types supported by the initialized template.
- If the CLI or npm registry is unavailable, report the blocker instead of copying the implementation into the skill.
