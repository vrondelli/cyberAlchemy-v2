# Invoke Refresh Report — SWU-APE-ONT-002

## Result

- Phase status: pass.
- Activation: continuation with explicit all-package execution authorization,
  resolved to the exact five-file SWU scope.
- Handoff: ready.
- Material mutation readiness: true.
- Live implementation state: unchanged; all post-images remain staged for Task
  Session.
- Next route: `task-session:SWU-APE-ONT-002`.

## Exact Material

- Package ID: `dsv2-ape-swu-ape-ont-002-20260805T141700Z`.
- Package digest: `8c8fca9e0564bba4ae8711d3b162f05dde14a66f77f03a26cf1b99ae25b267f6`.
- Producer receipt: `material/MATERIAL-RECEIPT.json`.
- Handoff result: `material/REFRESH-HANDOFF-RESULT.json`.
- Selection receipt: `plan-once/selection-receipt.json`.

The Task Session write inventory is exactly the ontology, portable base profile,
validator, `examples/enum/cases.json`, and
`examples/enum/evaluations.expected.json`.

## Staged Delta

- Add explicit owner-resolved expected Enum values and observed implementation
  values; neither is inferred from the other.
- Add generic array, `set_equals`, `unique`, `non_empty`, and `cardinality`
  behavior with typed operand contracts.
- Add portable Enum exact-set, uniqueness, non-empty, cardinality, and
  non-collapse constraints.
- Add eight deterministic cases: permuted positive, missing, extra, duplicate,
  empty, typed-field, identity, and transition negatives.
- Preserve the TypeScript example as a regression control and turn unsupported
  evaluator operators into contract errors rather than ordinary findings.

## Validation

- Work Pack plan-once audit: pass, `PLAN_SEMANTIC_READY`; the preserved first
  attempt correctly blocked a dependency outside the captured frontier.
- Explicit SWU-002 selection: pass, `SELECTION_READY`, with the SWU-001 receipt
  joined as its exact dependency.
- Isolated staged validator: pass twice with byte-identical output digest
  `1702dc0918b22b9218e0225fca47db62fda962ef4ffa6b9cbd75f35430769e9c`.
- Enum matrix: eight cases, exact expected findings, 22 properties, eight
  operators, 15 portable constraints, and zero validation errors.
- Material-package validator and Refresh handoff: pass; exact paths,
  dependencies, owner/publication boundary, plan binding, and package identity
  all pass.
- Dispatch Spec: pass, zero blocks, zero flags; the read-only helper is joined
  and closed.

## Claim Boundary

This proves material readiness for `SWU-APE-ONT-002` only. It does not prove
profile admission, later language adapters, whole-Enum completion, ontology
promotion, publication, release, deployment, or production readiness. Task
Session must rehash live baselines, issue the only mutation admission, apply
the staged post-images, run live validation twice, and issue the bounded SWU
receipt.

