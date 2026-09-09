# Domain

## CandidateNode

Required fields:

```yaml
node_id: stable local identifier
kind: session | discovery | research | findings
label: non-empty human label
source_selector: repository-relative evidence selector
source_digest: sha256
owner_route: named owner
candidate_status: candidate
confidence:
  evidence_confidence: low | medium | high
  commitment_confidence: low
challenge_contract:
  challenge_response: route-for-review
  valid_challenge_modes: [evidence, contradiction, owner_review]
  contradiction_edges: []
  validation_edges: []
  owner_route: named owner
  resolution_gate: named gate
  blocking_questions: []
  challenge_residue_route: named route
use_guidance: non-empty
residue_or_invalidation_route: named route
authority_effect: none
```

The carrier is prototype-local and candidate-only. It does not enact a vault or
authority-object schema.

## CandidateEdge

```yaml
edge_id: stable local identifier
source: existing node_id
predicate: derives-from | contradicts | creates | updates
target: existing node_id
evidence_refs: [non-empty selector]
authority_effect: none
```

Only forward predicates may be stored. Inverses such as `created-by` and
`derives` are read directions.

## RelationCandidate

A syntactically inspectable proposal whose predicate is not admitted by the
pinned policy. It has the same endpoint identity and provenance obligations as
an edge but is evaluated separately and cannot enter graph closure.

## PrototypePolicy

The policy binds:

- the exact edge grammar digests;
- node and relation schemas;
- closed-world enum behavior;
- cardinality checks;
- grounding acyclicity;
- contradiction non-composition;
- disposition and diagnostic vocabulary;
- owner route and version.

## Invariants

1. Governed inputs are immutable for the process lifetime.
2. Unknown values fail closed unless a declared candidate policy explicitly
   routes them to `policy-indeterminate`.
3. `authority_effect` is always `none`.
4. A policy pass is not semantic admission.
5. Receipts never share a path with fixtures.
6. Projections use stable source IDs and cannot become writer inputs.
