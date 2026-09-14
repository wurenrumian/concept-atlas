---
name: concept-atlas-dense-explain
description: Build high-density, navigable Concept Atlas webpages with the bundled React/Vite/MDX template. Use this skill whenever the user asks for a dense technical explanation, concept map, layered knowledge page, interactive explanation, or webpage resembling the bundled compile-runtime exemplar. Never replace the template with a custom JSX, HTML, CSS, or vertically-scrolling Markdown page.
---

# Concept Atlas Dense Explain

This is an Agent Skills-compatible skill. Keep the instructions and generated content portable across Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Cline, GitHub Copilot, and other agents that support `SKILL.md`.

Use the bundled template to turn knowledge into a concept tree, semantic relations, and compact reading blocks. The AI writes knowledge semantics; the template owns layout, CSS, graph rendering, navigation, zoom, search, and responsive behavior. The required deliverable is a built Concept Atlas webpage, normally `dist/index.html`, not a standalone mockup.

## Mandatory preflight and no-fallback rule

Before generating content, resolve the directory containing this `SKILL.md` and verify that these bundled files are readable:

- `assets/template/content/compile-runtime.mdx`
- `assets/template/src/app/App.jsx`
- `assets/template/src/components/MDXComponents.jsx`
- `assets/template/src/model/normalize-content.js`
- `references/components.md`

Read the exemplar and the component contract before writing. If the bundled template is unavailable, stop and report that the Concept Atlas template cannot be accessed. Do not create a custom JSX app, standalone HTML, CSS layout, Mermaid-only page, or vertically scrolling Markdown page as a substitute.

The template is the implementation boundary. Do not edit `src/`, styles, `index.html`, Vite configuration, or package dependencies for a content task. Only replace the MDX content after the template has been copied into the task workspace.

## Step 0 — Read the exemplar before writing

Read [assets/template/content/compile-runtime.mdx](assets/template/content/compile-runtime.mdx) in full first. It is the **reference standard**, not just a file to overwrite. Study its shape before generating anything:

- 1 `L0` root, ~5 `L1` branches, 2–3 children per branch, descending to `L3`/`L4` where the topic deserves it.
- Every `title` is a claim ("ABI 破坏：能链接，不等于能调用"), and every `summary` is a one-sentence judgment.
- Important nodes carry 3–6 semantic components, not one lone paragraph.
- Claims are backed by concrete commands, numbers, or named artifacts (`readelf -Ws`, `nm -C`, `objdump -dr`, `.bss`, ASLR).
- Cross-branch meaning is encoded as labeled `Relation`s, not prose.

## Workflow

1. Resolve and copy the complete `assets/template` directory into the task workspace; preserve its React, CSS, graph, and build files.
2. Read the exemplar above and [references/components.md](references/components.md) for the component and relation contract.
3. Replace only `content/compile-runtime.mdx`. Model one `L0` root, then `L1` structure, `L2` mechanisms, and optional `L3/L4` boundaries or failures. Keep each node focused on one claim.
4. Add `parent`/`Children` for hierarchy and `Relation` for cross-branch meaning. Never encode layout, coordinates, CSS, or SVG in MDX.
5. Give important nodes a definition, input/output, mechanism, one concrete example, and at least one boundary or evidence item.
6. Run the bundled content validator, then run `npm install` and `npm run build`. If validation or build fails, revise the MDX and do not return a substitute page.
7. Verify node switching, graph mode, search, URL `#node=...`, keyboard navigation, and responsive layout. Return the built `dist/index.html` path.

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
- [ ] Only the template's MDX content was changed; no replacement JSX or vertical article page was created.
- [ ] The bundled validator passes before the build.
- [ ] The template builds and node switching, graph mode, search, `#node=...`, and keyboard navigation all work.

## Portable template

The self-contained React/Vite/MDX implementation is in [assets/template](assets/template). Copy it into a project, replace `content/compile-runtime.mdx` **after studying it**, run `npm install`, then `npm run build`. The template has no dependency on the source repository's absolute paths. If the host agent cannot access or copy the template, stop and report the missing template; do not return a substitute webpage.

For the component contract, relation whitelist, and level semantics, read [references/components.md](references/components.md). For the exemplar breakdown, density targets, and prompt wording, read [references/prompting.md](references/prompting.md).
