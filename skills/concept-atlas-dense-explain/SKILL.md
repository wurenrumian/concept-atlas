---
name: concept-atlas-dense-explain
description: Generate high-density, navigable concept explanations as semantic MDX for the bundled Concept Atlas template. Use for dense explanations, concept maps, layered knowledge, mechanism breakdowns, or searchable interactive explanation pages.
---

# Concept Atlas Dense Explain

This is an Agent Skills-compatible skill. Keep the instructions and generated content portable across Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Cline, GitHub Copilot, and other agents that support `SKILL.md`.

Use the bundled template to turn knowledge into a concept tree, semantic relations, and compact reading blocks. The AI writes knowledge semantics; the template owns layout, CSS, graph rendering, navigation, zoom, search, and responsive behavior.

## Workflow

1. Model one `L0` root, then `L1` structure, `L2` mechanisms, and optional `L3/L4` boundaries or failures. Keep each node focused on one claim.
2. Add `parent`/`Children` for hierarchy and `Relation` for cross-branch meaning. Never encode layout, coordinates, CSS, or SVG in MDX.
3. Give important nodes a definition, input/output, mechanism, one concrete example, and at least one boundary or evidence item.
4. Prefer horizontal semantic components (`Grid`, `Split`, `Flow`, `Compare`, `Timeline`, `Tradeoff`) for comparisons and sequences. Use `Details` for secondary detail; do not turn every fact into a card.
5. Use `LearningObjectives`, `KeyQuestion`, `Evidence`, `Invariant`, and `FailureMode` when they improve understanding or verification. Keep the first screen to the core claim plus 3–5 key facts.
6. Build with the bundled template and verify node switching, graph mode, search, URL `#node=...`, keyboard navigation, and responsive layout.

## Content rules

- Start with a one- or two-sentence core judgment.
- Use tables/flows for comparison and causality; use short paragraphs only for explanation.
- Every dense block should contain a conclusion, evidence, or limitation.
- Prefer 2–4 columns on wide screens and natural stacking on narrow screens.
- Do not invent unsupported components. Read `references/components.md` for the supported semantic API.

## Portable template

The self-contained React/Vite/MDX implementation is in [assets/template](assets/template). Copy it into a project, replace `content/compile-runtime.mdx`, run `npm install`, then `npm run build`. The template has no dependency on the source repository's absolute paths. If the host agent cannot create files, return the MDX and explain the copy/build commands instead.

For the component contract and request priorities, read [references/components.md](references/components.md). For AI prompt wording and component selection, read [references/prompting.md](references/prompting.md).
