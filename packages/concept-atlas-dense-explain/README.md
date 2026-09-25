# concept-atlas-dense-explain

Compile semantic MDX into a standalone, interactive Concept Atlas HTML page. The
same workflow ships as an AI-agent skill, so an agent can generate, validate and
render a "dense explainer" without hand-writing any layout.

Two page shells share one component library:

- `atlas` — concept graph with node navigation (`ExplainPage` → `ConceptGraph` → `ConceptNode`)
- `scroll` — continuous document with an auto-built table of contents

## CLI

```bash
# Learn the components from a real, compilable reference
npx concept-atlas-dense-explain guide --mode atlas -o atlas-guide.mdx
npx concept-atlas-dense-explain guide --mode scroll -o scroll-guide.mdx

# Scaffold a document skeleton
npx concept-atlas-dense-explain create topic.mdx --mode atlas

# Validate structure before building
npx concept-atlas-dense-explain validate topic.mdx --mode atlas

# Compile to a standalone HTML file beside the MDX
npx concept-atlas-dense-explain topic.mdx --mode atlas
```

`guide` and `create` refuse to overwrite an existing file unless `--force` is
passed. Use `-o` to choose the output path (a directory when passing several
inputs). Validation errors abort the build; `--no-validate` forces a knowingly
broken build.

Mermaid loads from a CDN at runtime by default (fast builds, needs network);
`--inline-mermaid` bakes it into the HTML for a fully offline single file, and
`--mermaid-cdn` overrides the CDN URL. Appearance defaults can be baked with
`--skin`, `--default-mode` and `--style`; readers can still switch in the UI.
Local figures link by default (small HTML, ship `assets/` beside the output);
`--inline-assets` bakes them in as base64 for a self-contained file, and a
per-figure `inline={true|false}` overrides that choice.

Run `npx concept-atlas-dense-explain help` for the full flag list.

## Links

- Repository: https://github.com/wurenrumian/concept-atlas
- Framework guide: [`docs/FRAMEWORK.md`](https://github.com/wurenrumian/concept-atlas/blob/master/docs/FRAMEWORK.md)
- Usage recipes: [`docs/USAGE.md`](https://github.com/wurenrumian/concept-atlas/blob/master/docs/USAGE.md)

## License

MIT
