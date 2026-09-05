# Component contract

## Structure

```mdx
<ExplainPage id="topic" title="..." summary="...">
  <ConceptGraph root="root">
    <ConceptNode id="root" title="..." level="L0" summary="...">
      <Definition>...</Definition>
      <Input>...</Input><Output>...</Output>
      <Children><ConceptRef id="child" /></Children>
    </ConceptNode>
    <ConceptNode id="child" title="..." level="L1" parent="root">...</ConceptNode>
    <Relation from="child" to="other" type="depends-on" label="依赖" />
  </ConceptGraph>
</ExplainPage>
```

Supported semantic content includes `Overview`, `Definition`, `Mechanism`, `Implementation`, `Example`, `Counterexample`, `Boundary`, `Prerequisite`, `Input`, `Output`, and `Glossary`.

High-value verification components: `LearningObjectives`, `KeyQuestion`, `Evidence(command, observes)`, `Invariant(title)`, `FailureMode(symptom, cause, evidence, remedy)`, and `Tradeoff(options)`.

Presentation components: `Stack`, `Grid`, `Split`, `Tabs`, `Flow`, `Compare`, `DecisionMatrix`, `Timeline`, `Callout`, `Details`, `RelationMap`, `RelationPath`, `Insight`, and `NoteGrid`.

## Request priorities

The portable template covers the core `req.md` contract, node exploration, graph view, semantic relations, search, level/relation filters, URL node state, browsing history, keyboard shortcuts, Mermaid zoom, and responsive rendering. Evidence-oriented components and compact tradeoffs cover the highest-value `request.md` enhancements without adding permanent side panels.
