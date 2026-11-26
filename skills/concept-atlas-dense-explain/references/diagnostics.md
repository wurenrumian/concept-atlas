# Validation diagnostics

Human-readable diagnostics use `error|warn line:column CODE message`; `--json` returns structured objects. Fix every error before building. Warnings usually mean the page still renders but loses structure, provenance, or reader clarity; fix them when cheap, and use `--strict` when a clean result is required.

## Errors — fix before building

| Code | What it means | What to do |
| --- | --- | --- |
| `UNKNOWN_COMPONENT` | The tag is not registered. | Replace it with a component from `components.md`; do not invent aliases except `Image` for `Figure`. |
| `CARRIER_MISSING` | Neither page shell was found. | Add exactly one `ExplainPage` or `ScrollDocument` shell. |
| `CARRIER_CONFLICT` | Both shells occur in one file. | Keep one shell; convert the outer structure rather than nesting both. |
| `CARRIER_MODE_MISMATCH` | The file's shell disagrees with `--mode`. | Pass the matching `--mode atlas` or `--mode scroll`, or convert the file. |
| `NODE_MISSING_ID` | A `ConceptNode` has no stable id. | Add a unique kebab-case id. |
| `DUPLICATE_NODE_ID` | Two nodes share an id. | Rename one and update `parent`, `ConceptRef`, and `Relation` references. |
| `NODE_MISSING_TITLE` | A node has no readable title. | Add a claim-like `title`; an id alone is not enough. |
| `MISSING_PARENT` | A non-root node points to a missing parent. | Correct the parent id or remove it for the root. |
| `GRAPH_ROOT_UNRESOLVED` | `ConceptGraph root` names no node. | Point it at the `L0` node id. |
| `REF_MISSING_ID` | `ConceptRef` has no id. | Add the target node id. |
| `REF_UNRESOLVED` | `ConceptRef` points at no node. | Correct the id or add the missing node. |
| `RELATION_FROM_UNRESOLVED` | A relation's source id is missing. | Correct `from` or add the source node. |
| `RELATION_TO_UNRESOLVED` | A relation's target id is missing. | Correct `to` or add the target node. |

## Warnings — fix when cheap

| Code | What it means | What to do |
| --- | --- | --- |
| `NODE_MISSING_SUMMARY` | A node has no one-sentence summary. | Add `summary`; a string-only `Overview` can supply it in atlas. |
| `NODE_NO_CORE_CONTENT` | A node only repeats metadata or navigation. | Add definition, mechanism, evidence, example, model, or boundary content; merge it if it is only a stub. |
| `NO_ROOT_LEVEL` | The atlas has no `L0` root. | Mark exactly one root node `level="L0"`; `--strict` promotes this warning. |
| `MULTIPLE_ROOT_LEVEL` | More than one node is marked `L0`. | Keep one `L0`; make the other top-level branches `L1`. |
| `UNKNOWN_LEVEL` | `level` is outside `L0`–`L4`. | Use a declared level that matches the node's cognitive depth. |
| `UNKNOWN_KIND` | `kind` is outside the whitelist. | Use `system`, `stage`, `mechanism`, `artifact`, `failure`, `tool`, `boundary`, or `decision`, or omit it. |
| `MECHANISM_KIND_UNVERIFIED` | A mechanism node lacks `Invariant` or `Evidence`. | Add the invariant or evidence that makes the mechanism checkable. |
| `FAILURE_KIND_UNSTRUCTURED` | A failure node lacks a structured `FailureMode`. | Add `symptom`, `cause`, `evidence`, or `remedy`; `--strict` promotes this warning. |
| `FAILURE_MODE_EMPTY` | A self-closing `FailureMode` has no fields or children. | Supply at least one failure field or explanatory children. |
| `UNKNOWN_RELATION_TYPE` | The relation type is not in the whitelist. | Use a type from `SKILL.md`; do not express parent-child hierarchy as a relation. |
| `RELATION_MISSING_LABEL` | The edge has no reader-facing label. | Add a short `label` that states the relation's meaning. |
| `RELATION_SELF` | A relation starts and ends at the same node. | Remove it or connect two distinct nodes. |
| `PROP_EXPECTS_ARRAY` | An array prop received a string or non-array expression. | Pass an array literal such as `steps={[...]}`; check `components.md` for the item shape. |
| `MATH_CHILDREN_BRACES` | LaTeX in children contains MDX expression syntax. | Move the formula into `formula="..."` or a template literal. |
| `PROSE_EXPRESSION` | Prose was parsed as a JavaScript expression. | Escape or rewrite the braces; use a code block for literal syntax. |
| `FRONTMATTER_UNSUPPORTED` | The MDX frontmatter uses fields the renderer does not consume. | Remove the unsupported fields; keep authoring metadata outside the page shell. |
| `GRAPH_MISSING_ROOT` | `ConceptGraph` has no explicit root. | Add `root="<L0-id>"`; omission currently infers a root and warns. |
| `FIGURE_MISSING_SRC` | `Figure` has no image source. | Add a valid local path or remote URL. |
| `ASSET_MISSING` | A relative image path does not exist. | Correct the path relative to the MDX file. |
| `ASSET_REMOTE` | An image uses an `http(s)` URL. | Keep it only when remote loading is acceptable; otherwise use a local asset. |
| `ASSET_LARGE` | An asset over 512KB is inlined by `--inline-assets` or a per-figure `inline` prop. | Compress it, link it instead, or set `inline={false}` for that figure. |
| `FIGURE_REF_UNRESOLVED` | `FigureRef` names no figure id. | Add the matching `id` or correct the reference. |
| `FIGURE_REF_MISSING_ID` | `FigureRef` has no id. | Add the target figure id. |
| `FIGURE_DUPLICATE_ID` | Two figures share an id. | Rename one and update its references. |
| `REF_SELF` | A node lists itself as a child. | Remove the self-reference; use `parent` and `Children` for real hierarchy. |

## Promoted by `--strict`

`NO_ROOT_LEVEL`, `MULTIPLE_ROOT_LEVEL`, `MECHANISM_KIND_UNVERIFIED` and `FAILURE_KIND_UNSTRUCTURED` are warnings that `--strict` turns into errors. The first two mean the atlas has no `L0` or has more than one; keep exactly one root.
