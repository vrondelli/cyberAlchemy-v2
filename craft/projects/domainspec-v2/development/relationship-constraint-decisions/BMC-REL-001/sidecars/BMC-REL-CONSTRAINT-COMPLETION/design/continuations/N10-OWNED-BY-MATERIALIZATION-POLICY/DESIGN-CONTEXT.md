# N10 Design Context

## Objective

Continue from exact N09 selection A. Generated, non-authoritative `owned-by`
navigation preserves the exact admitted D29 dimension from its canonical `owns`
fact. N10 isolates whether this projection is computed from canonical authority when
requested or may exist as a rebuildable materialized generated projection.

## Exact Predicate

Option A would compute `owned-by_d(t,o)` from current canonical `owns_d(o,t)` facts
without independently persisted projection state. Option B would permit a persisted
projection only as derived, non-authoritative state with provenance, deterministic
regeneration, and stale/drift repair obligations.

## Evidence Boundary

D22 admits non-authoritative views/read models, D25 admits generated artifacts, and
D27 requires equivalent projections to retain provenance to one canonical authored
fact. None chooses materialization. N10 does not choose a store, schema, serialization,
cache, synchronization timing, API, or implementation.

## Dispatch Technique Trace

| Technique | Activation | Effect | Validation |
|---|---|---|---|
| `sequence` | N09 A precedes N10 | dimension identity fixed before materialization | receipt checks |
| `owner_boundary_check` | computed/materialized changes architecture and drift obligations | A/B authority-gated | prefilter |
| `residue_ledger` | storage technology and other axes remain separate | explicit exclusions | boundary checks |
| `artifact_contract_bridge` | manifest feeds extractor and selector | fixed point | replay |
| `concrete_path_evidence` | 14 SHA-bound sources | no ambient inference | SHA checks |
| `validation_loop` | deterministic generated artifacts | byte identity | validator |
| `frame_handoff` | stop at N10 | one unselected gate | runtime handoff |

A full dispatch document is unnecessary: one owner, one write root, no delegation,
no protected-context crossing, and one terminal gate.

## Obligations

1. Bind exact N09 A and recording-time semantics.
2. Preserve dimension-bearing, generated-only, non-authoritative `owned-by`.
3. Compare computation from canonical authority with a rebuildable materialized projection.
4. Carry provenance/regeneration/drift only as conditional B obligations.
5. Do not select storage technology, syntax, serialization, caching, API, or timing.
6. Present A, B, defer, and stop with aligned examples and no decision effect.
7. Stop before N10 selection, Plan, or implementation.

Authority effect: `none`.
