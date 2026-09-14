---
name: concept-atlas-dense-explain
description: Generate high-density, navigable concept explanations as semantic MDX for the bundled Concept Atlas template. Use for dense explanations, concept maps, layered knowledge, mechanism breakdowns, or searchable interactive explanation pages.
---

# Concept Atlas Dense Explain

This is an Agent Skills-compatible skill. Keep the instructions and generated content portable across Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Cline, GitHub Copilot, and other agents that support `SKILL.md`.

Use the bundled template to turn knowledge into a concept tree, semantic relations, and compact reading blocks. The AI writes knowledge semantics; the template owns layout, CSS, graph rendering, navigation, zoom, search, and responsive behavior.

## Step 0 — Read the exemplar before writing

Read [assets/template/content/compile-runtime.mdx](assets/template/content/compile-runtime.mdx) in full first. It is the **reference standard**, not just a file to overwrite. Study its shape before generating anything:

- 1 `L0` root, ~5 `L1` branches, 2–3 children per branch, descending to `L3`/`L4` where the topic deserves it.
- Every `title` is a claim ("ABI 破坏：能链接，不等于能调用"), and every `summary` is a one-sentence judgment.
- Important nodes carry 3–6 semantic components, not one lone paragraph.
- Claims are backed by concrete commands, numbers, or named artifacts (`readelf -Ws`, `nm -C`, `objdump -dr`, `.bss`, ASLR).
- Cross-branch meaning is encoded as labeled `Relation`s, not prose.

## Workflow

1. Read the exemplar above and [references/components.md](references/components.md) for the component and relation contract.
2. Model one `L0` root, then `L1` structure, `L2` mechanisms, and optional `L3/L4` boundaries or failures. Keep each node focused on one claim.
3. Add `parent`/`Children` for hierarchy and `Relation` for cross-branch meaning. Never encode layout, coordinates, CSS, or SVG in MDX.
4. Give important nodes a definition, input/output, mechanism, one concrete example, and at least one boundary or evidence item.
5. Prefer horizontal semantic components (`Grid`, `Split`, `Flow`, `Compare`, `Timeline`, `Tradeoff`) for comparisons and sequences. Use `Details` for secondary detail; do not turn every fact into a card.
6. Use `LearningObjectives`, `KeyQuestion`, `Evidence`, `Invariant`, and `FailureMode` when they improve understanding or verification. Keep the first screen to the core claim plus 3–5 key facts.
7. Build with the bundled template and verify node switching, graph mode, search, URL `#node=...`, keyboard navigation, and responsive layout.

## Content rules

- Start with a one- or two-sentence core judgment.
- Use tables/flows for comparison and causality; use short paragraphs only for explanation.
- Every dense block should contain a conclusion, evidence, or limitation.
- Prefer 2–4 columns on wide screens and natural stacking on narrow screens.
- Do not invent unsupported components or relation types. Read [references/components.md](references/components.md) for the supported semantic API.
- Aim for the exemplar's scale: roughly 1 root, 4–5 `L1` branches, ~15–25 nodes total. A thin graph (few nodes, one paragraph each) is a failure, not a shortcut.

## Self-check before finishing

Run this checklist and revise until every item passes. If an item fails, fix the content instead of adding decoration.

- [ ] One `L0` root; every `L1` belongs to it; depth reaches `L3`/`L4` where warranted.
- [ ] Every key node has a claim-style `title`, a one-line `summary`, and at least one of `Definition` / `Mechanism` / `Example` / `Evidence` / `Boundary`.
- [ ] Several nodes carry concrete, verifiable evidence (real commands, metrics, or named artifacts) rather than generic filler.
- [ ] Cross-branch meaning is encoded with `Relation` using only the whitelisted types in `references/components.md`.
- [ ] First screen shows the core claim plus 3–5 key facts; long detail lives in `Details` / `Tabs`.
- [ ] No CSS, coordinates, SVG, or layout instructions appear in the MDX.
- [ ] The template builds and node switching, graph mode, search, `#node=...`, and keyboard navigation all work.

## Portable template

The self-contained React/Vite/MDX implementation is in [assets/template](assets/template). Copy it into a project, replace `content/compile-runtime.mdx` **after studying it**, run `npm install`, then `npm run build`. The template has no dependency on the source repository's absolute paths. If the host agent cannot create files, return the MDX and explain the copy/build commands instead.

For the component contract, relation whitelist, and level semantics, read [references/components.md](references/components.md). For the exemplar breakdown, density targets, and prompt wording, read [references/prompting.md](references/prompting.md).
