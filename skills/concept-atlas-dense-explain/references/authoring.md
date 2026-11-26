# Authoring and document conversion

Use this reference when turning source material into a page, or when deciding whether a draft is complete. Component APIs live in `components.md`; this file governs structure, fidelity, and stopping conditions.

## Choose the shell from the reading task

- Choose `atlas` when readers need to compare concepts, follow cross-branch relations, or explore details out of order.
- Choose `scroll` when the source's argument must be read in order: tutorials, reports, procedures, and long-form explanations.
- If an `.mdx` file already exists, detect and keep its shell unless the user asks to convert it. Never make one file both shells.

## Turn a document into a page

Restructure the source; do not paste it into one node or section. Map the source's own outline first, then convert each unit into one claim with its supporting material.

| Source material | Preferred expression |
| --- | --- |
| Chapter or major heading | One `ScrollSection`, or one named concept node in `atlas` |
| Neutral table or raw observations | `DataTable` |
| Options compared against criteria | `DecisionMatrix` or `Tradeoff` |
| Two-dimensional positioning | `MatrixModel` |
| Ordered process | `Flow` or `WorkedExample` + `Step` |
| Dated sequence | `Timeline` |
| Before/after or alternative designs | `Compare` or `CodeDiff` |
| Headline number | `Metric` |
| Repeated definition or prose | One `Definition` plus its evidence; merge duplicates |
| Citation or source claim | `Cite` + `References`, and `Source` where provenance matters |

Preserve the source's citations, qualifications, counterexamples, and uncertainty. Do not invent evidence, citations, measurements, or examples to make the page look complete. If the source leaves a material gap, say so in the page or report it to the user.

Finish with a short mapping report: what was restructured, merged, dropped, or left unresolved. This lets the user check that the conversion did not silently change the argument.

## Density means information gain, not quotas

A branch that only restates its title is a stub. A block that repeats the previous block in different styling is also a stub. Fix both by adding new information or merging the unit.

For each important concept, ask:

1. **What is it?** Give a precise definition or mental model.
2. **Why or how does it work?** Explain the mechanism, cause, or decision rule.
3. **What supports it?** Add evidence, a worked example, data, or a citation when available.
4. **Where does it stop?** State a boundary, failure mode, trade-off, or counterexample when relevant.

These are coverage questions, not required block counts. A simple concept may need only a definition and an example; a complex mechanism may need several models and a failure analysis. Stop when the reader can answer the concept's key question and check the important claims. Never split prose or fabricate substance merely to hit a number.

In `scroll`, one section should make one claim plus its evidence. Split a section when it changes subject or develops a second independent claim, not because it crosses an arbitrary screen count.

## Component selection follows the relationship

Use the component whose data shape matches the information, not the one with the most decorative treatment. A `Flow` expresses order; `Timeline` adds time; `StateMachine` adds states and transitions; `DecisionTree` adds conditions; `FeedbackLoop` adds feedback polarity. If two components would show the same text, keep one.

## Final content check

Before compiling, verify:

- Every important unit has a claim-like title and non-duplicated substance.
- Every node has `title` and `summary`; every relation has a meaningful `label`.
- All ids, parents, refs, relation endpoints, figures, and citations resolve.
- Source claims remain traceable, and uncertainty has not been silently upgraded into certainty.
- The page answers the user's actual reading task rather than merely displaying many components.
