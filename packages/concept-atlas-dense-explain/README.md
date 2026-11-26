# concept-atlas-dense-explain

Compile semantic MDX into a standalone, interactive Concept Atlas HTML page. The
same workflow ships as an AI-agent skill, so an agent can generate, validate and
render a "dense explainer" without hand-writing any layout.

Two page shells share one component library:

- `atlas` — concept graph with node navigation (`ExplainPage` → `ConceptGraph` → `ConceptNode`)
- `scroll` — continuous document with an auto-built table of contents

## CLI

```bash
# Optional: learn from a compilable reference; also overwrites assets/ beside the output
npx concept-atlas-dense-explain guide --mode atlas -o atlas-guide.mdx
npx concept-atlas-dense-explain guide --mode scroll -o scroll-guide.mdx

# Scaffold a document skeleton
npx concept-atlas-dense-explain create topic.mdx --mode atlas

# Validate structure before building
npx concept-atlas-dense-explain validate topic.mdx --mode atlas

# Compile to a standalone HTML file beside the MDX
npx concept-atlas-dense-explain topic.mdx --mode atlas
```

Existing outputs are overwritten, and `guide` also overwrites `assets/` beside
its output. `--force` is accepted for compatibility and is a no-op. `create` and
`guide` default to `scroll`; validation and builds detect the MDX shell when
`--mode` is omitted. Use `-o` to choose the output path (a directory when passing
several inputs). Validation errors abort the build; `--no-validate` forces a
knowingly broken build.

Mermaid-syntax diagrams are rendered by Pele, which ships inline: diagrams need
no chart CDN, and a document without `<Mermaid>` drops the renderer entirely.
Fonts may still load from Google Fonts and fall back to system fonts offline.
Appearance defaults can be baked with `--skin`, `--default-mode` and `--style`;
readers can still switch in the UI. Local figures link by default (small HTML,
ship `assets/` beside the output); `--inline-assets` bakes them in as base64 for
a self-contained file, and a per-figure `inline={true|false}` overrides that choice.

Run `npx concept-atlas-dense-explain help` for the full flag list.

## Links

- Repository: https://github.com/wurenrumian/concept-atlas
- Documentation index: [`docs/README.md`](https://github.com/wurenrumian/concept-atlas/blob/master/docs/README.md)
- Framework guide: [`docs/FRAMEWORK.md`](https://github.com/wurenrumian/concept-atlas/blob/master/docs/FRAMEWORK.md)
- Usage recipes: [`docs/USAGE.md`](https://github.com/wurenrumian/concept-atlas/blob/master/docs/USAGE.md)

## License

MIT
