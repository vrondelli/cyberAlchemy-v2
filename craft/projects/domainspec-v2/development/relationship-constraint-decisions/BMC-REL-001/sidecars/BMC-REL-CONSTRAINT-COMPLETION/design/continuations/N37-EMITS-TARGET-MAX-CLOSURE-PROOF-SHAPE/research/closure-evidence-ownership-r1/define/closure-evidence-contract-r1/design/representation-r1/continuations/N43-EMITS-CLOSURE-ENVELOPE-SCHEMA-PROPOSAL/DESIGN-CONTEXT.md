# N43 Design context: closure envelope schema proposal

Status: proposal-only direct Design unit; no Decision Gate and no schema admission.

N42-A selects one carrier fact only: the consumer-owned sidecar contains every exact eligible Entity/Event population, placement collection, and incoming canonical `emits` fact collection inline. It does not select a serialization or schema.

Inventory lookup is current and lookup-ready. Exact live precedents converge on one machine-contract convention: JSON Schema Draft 2020-12, recursively closed objects, digest-bound references, and arrays with `uniqueItems` for exact-set members. No evidence-backed competing formalism exists, so N43 does not manufacture JSON-versus-YAML or flat-versus-nested owner options.

N43 materializes a candidate-local envelope schema and a minimal valid fixture. The schema keeps membership, placement, adjacency, snapshot provenance, attestation, and currentness as separate groups; permits empty exact sets so it cannot infer positive numeric minima; and leaves boundary-kind/currentness references opaque. Cross-group equality and endpoint-membership rules remain semantic-validator obligations because ordinary JSON Schema cannot prove set equality across fields.

Dispatch technique trace: `sequence` orders envelope schema before evaluator-receipt schema; `owner_boundary_check` keeps consumer completeness separate from compiler/evaluator authority; `artifact_contract_bridge` reuses exact live schema conventions; `validation_loop` validates the candidate and hostile mutations. A full dispatch document is not required for this one bounded proposal unit.

Claim ceiling: N43 proposes bytes only. It does not admit a canonical schema, authorize a producer or evaluator, change packet or profile state, implement runtime behavior, publish, release, deploy, or reopen D06.
