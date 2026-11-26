# CLI reference

Use this reference when scaffolding, validating, compiling, batching, or configuring appearance. The main workflow is in `SKILL.md`.

## Runner

Always invoke the CLI through `npx`, from any directory:

```bash
npx concept-atlas-dense-explain <args>
```

This is the only runner. Do not search for a local binary, repository checkout, or installed copy, and do not run the framework repository's own `npm` scripts. The first call may download the package from npm; say so once, then continue. Use `npx concept-atlas-dense-explain help` when a flag is unclear and `--version` when diagnosing a version mismatch.

## Core commands

```bash
# Optional skeleton; defaults to scroll and overwrites the target.
npx concept-atlas-dense-explain create <file>.mdx --mode atlas|scroll

# Validate before rendering.
npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll
npx concept-atlas-dense-explain validate <file>.mdx --mode atlas|scroll --json

# Compile; detects the MDX shell when --mode is omitted and writes beside the MDX unless -o is given.
npx concept-atlas-dense-explain <file>.mdx --mode atlas|scroll [-o out.html]

# Build several documents; -o becomes a directory.
npx concept-atlas-dense-explain a.mdx b.mdx c.mdx -o dist [--concurrency 3]
```

`create`, `guide`, and compiled HTML outputs overwrite existing files. `guide` also copies its sample resources into `assets/` beside the output and overwrites matching files. Do not point it at a path containing user work unless overwriting is intended; choose a new path or ask first.

`guide` is only needed when the user wants a project-local, compilable copy of the bundled example. The installed skill already contains `references/atlas-guide.mdx` and `references/scroll-guide.mdx`; do not generate another copy just to learn the components.

## Flags

| Flag | Meaning |
| --- | --- |
| `--mode atlas\|scroll` | Selects the page shell. `create` / `guide` default to `scroll`; validation and builds detect the shell when omitted. Keep it consistent across commands when specified. |
| `-o <path>` | Output HTML file, or output directory for multiple inputs. |
| `--strict` | Promotes structural warnings to validation errors. |
| `--json` | Machine-readable validation output. |
| `--no-validate` | Skips validation and knowingly allows a broken build. Use only with an explicit reason. |
| `--inline-assets` | Inlines every local image as base64. |
| `--link-assets` | Explicit alias for the default linked-image behavior; mutually exclusive with `--inline-assets`. |
| `--concurrency <N>` | Parallel build limit for multiple inputs; default 2, capped at 4. |
| `--skin <id>` | Bakes a default palette. |
| `--default-mode dark\|light\|system` | Bakes a default color mode. |
| `--style <id>` | Bakes a default component style. |
| `--force` | Compatibility no-op; outputs are overwritten anyway. |

## Appearance

Pages ship a reader-facing appearance menu: palette (`aurora` indigo, `ember` gold, `verdant` forest, `sakura` pink-plum, `noir` ink), dark/light mode, and component style (`manuscript` editorial marginalia, `classic` boxed cards, `shadcn` hairline-bordered minimal UI, `elastic` bordered observability panels). The shipped default is aurora × manuscript × light, and choices persist in localStorage.

Bake different defaults only when the user asks:

```bash
npx concept-atlas-dense-explain article.mdx --mode scroll \
  --skin ember --default-mode dark --style classic
```

`--default-mode system` resolves to the carrier default (`light`). Content MDX never sets appearance.

## Assets and offline behavior

- `<Mermaid>` diagrams are rendered by Pele and inlined, so diagrams need no chart CDN. A page without `<Mermaid>` drops the renderer entirely.
- Fonts may load from Google Fonts at runtime and fall back to the system stack offline.
- Local images stay relative links by default. Ship the `assets/` directory beside the HTML, or use `--inline-assets`.
- A per-figure `inline={true}` / `inline={false}` overrides the global flag for one image.
- Remote images remain links and require network access.
- Never add dummy `<Math>` or `<Mermaid>` nodes to enable a renderer; builds include only what the content uses.

## Version mismatch

The skill documentation and the npm `latest` CLI are released separately. If a documented component is rejected as `UNKNOWN_COMPONENT` after `npx` has fetched `latest`, report the likely version mismatch and the versions involved. Do not copy package implementation files into the skill, invent a replacement API, or silently downgrade the page.
