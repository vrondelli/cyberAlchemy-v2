# UX Rule Governed Artifact Tree Example

Status: example-only candidate package  
Owner: CyberAlchemy v2 development examples  
Authority effect: none

This package makes one UX rule concrete across four distinct layers:

1. canonical artifact instances under `artifacts/`;
2. typed artifact links in [`tree.json`](tree.json);
3. candidate ontology nodes and relations under `ontology/`;
4. illustrative UX fixtures under `fixtures/`.

The example rule is:

> In the cart scenario, the remove-item button must expose a non-empty
> accessible name.

Nothing here records a real browser observation, owner promotion, runtime
conformance result, or live ontology schema change. The package is deliberately
blocked at candidate status so its links can be exercised without creating
authority by proximity.

## Model Sources

- [`CAV2-D42` governed artifact tree](../../../authority/definitions/DEFINITIONS.md#cav2-d42-governed-artifact-tree)
- [`CAV2-D45` UX/UI knowledge governance](../../../authority/definitions/DEFINITIONS.md#cav2-d45-uxui-knowledge-governance)
- [`CAV2-D46` experience evidence lifecycle](../../../authority/definitions/DEFINITIONS.md#cav2-d46-experience-evidence-lifecycle)
- [`CAV2-D47` interface evidence boundary](../../../authority/definitions/DEFINITIONS.md#cav2-d47-interface-evidence-boundary)
- [`CAV2-D51` canonical artifact](../../../authority/definitions/DEFINITIONS.md#cav2-d51-canonical-artifact)
- [Canonical Kinds](../../../ontology/CANONICAL-KINDS.md)
- [Node Model](../../../ontology/NODE-MODEL.md)
- [Relation Model](../../../ontology/RELATION-MODEL.md)
- [Ontology Package Model](../../../ontology/PACKAGE-MODEL.md)

## Package Map

```text
artifacts/discovery.md
  -> artifacts/research.md
  -> artifacts/decision.md
  -> artifacts/spec.md
  -> artifacts/runtime-contract.md
  -> artifacts/review.md

artifacts/residue.md
  flags what browser evidence cannot prove

artifacts/projection.md
  shows the optional read-model destination, still deferred

tree.json
  binds artifacts, evidence, promotion, validation, challenge, and drift

ontology/nodes.json
  selects candidate meaning from the artifact package through source_refs

ontology/relations.json
  stages evidence, owner routing, decision, residue, and projection relations
```

## Validate The Links

The validator uses only Node.js built-ins:

```bash
node cyberAlchemy-v2/development/examples/ux-rule-governed-artifact-tree/scripts/validate.mjs
```

It checks package-local file references, canonical-kind rollups used by the
example, required `CAV2-D42` fields, node contracts, relation endpoints,
relation effects, and the explicit unmapped runtime-contract residue.

It does **not** validate UX behavior or accessibility. The fixture pages are
inputs for a future Playwright calibration run; today their expected outcomes
are illustrative only.

## Intended Next Experiment

1. Add a small Playwright scenario that loads all three fixtures.
2. Capture accessibility-tree or role/name evidence.
3. Replace the synthetic review with a real evidence report.
4. Keep comprehension, trust, preference, and complete-accessibility claims in
   residue.
5. Route any runtime-contract node-model extension through schema governance
   instead of adding a live node type here.

