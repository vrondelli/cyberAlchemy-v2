# N07 Design Context

## Objective

Continue from exact N06 selection A. Same-dimension directed `owns` cycles over two
or more distinct Entities are rejected. N07 isolates whether a directed closed path
that uses at least two admitted D29 dimensions is invalid merely because the combined
cross-axis path closes.

## Evidence Boundary

The exact 14-source denominator is closed in `DESIGN-SCOPE-MANIFEST.json`. D29 says
its active dimensions are pairwise non-overlapping semantic axes and permits distinct
owners for distinct dimensions. It does not infer mixed-dimension topology. N04 and
N06 already reject direct self-edges and same-dimension cycles.

## Dispatch Technique Trace

| Technique | Activation | Effect | Validation |
|---|---|---|---|
| `sequence` | N06 A precedes N07 | preserves same-axis rejection before cross-axis classification | receipt/lifecycle checks |
| `owner_boundary_check` | allow/reject changes semantic validity | A/B authority-gated | prefilter checks |
| `residue_ledger` | transitivity, duplicates, and other axes remain open | explicit exclusions | boundary assertions |
| `artifact_contract_bridge` | sources feed Design contracts | manifest to receipt to result | fixed point |
| `concrete_path_evidence` | 14 exact sources | no ambient inference | SHA checks |
| `validation_loop` | deterministic generated artifacts | replay byte identity | validator |
| `frame_handoff` | stop at N07 | one unselected gate | runtime handoff |

A full dispatch document is unnecessary: one owner, one write root, no delegation,
no protected-context crossing, and one terminal gate.

## Obligations

1. Bind exact N06 A and recording-time semantics.
2. Preserve N04 direct-self-edge and N06 same-dimension-cycle rejection.
3. Detect cross-axis closure without collapsing D29 dimensions.
4. Compare allow-versus-reject solely for mixed-dimension closure.
5. Reject unsupported per-combination exceptions and token-derived behavior.
6. Present allow, reject, defer, and stop only.
7. Provide aligned examples with no decision effect.
8. Stop before N07 selection, Plan, or implementation.

Authority effect: `none`.
