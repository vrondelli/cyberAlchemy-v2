# Define Context

- Intent: place all five existing ontology graphs inside the same navigable
  canvas.
- Approved interpretation: one persistent graph projection; filters focus/hide
  families and never replace the graph.
- Current evidence: `architecture-ontology-view.html` stores `state.view` and
  dispatches `buildGraph()` to five separate builders.
- Existing sources: current ontology, meta-type projection, four profiles,
  supplied TypeScript facts, and expected findings.
- Discovery disposition: waived because the user selected the presentation
  outcome and the existing experiment already closes the source vocabulary.
- Complexity: medium; projection, layout, interaction, accessibility, responsive
  behavior, and browser acceptance can fail independently.
- Distill budget: Standard, assumed because no explicit budget was supplied.
- Mutation posture: authoring only; existing canvas and data are read-only.
